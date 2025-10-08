use crate::archive::event::{ArchiveEventEmitter, ArchiveEventType};

use log::debug;
use notify::{RecommendedWatcher, RecursiveMode, Result as NotifyResult, Watcher, event::Event};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, mpsc};
use std::thread;
use std::time::{Duration, Instant};

/// Represents a debounced event with timing information
#[derive(Debug, Clone)]
struct DebouncedEvent {
    kind: notify::EventKind,
    timestamp: Instant,
}

const DEBOUNCE_DURATION: Duration = Duration::from_millis(1000);

/// Manages file system watching for a single archive file
pub struct ArchiveWatcher<E: ArchiveEventEmitter + Send + Sync + Clone + 'static> {
    path: String,
    event_emitter: E,
    stop_tx: Option<mpsc::Sender<()>>,
    suppress_flag: Arc<AtomicBool>,
    thread_handle: Option<thread::JoinHandle<()>>,
}

impl<E: ArchiveEventEmitter + Send + Sync + Clone + 'static> ArchiveWatcher<E> {
    /// Create a new ArchiveWatcher for the given path
    pub fn new(path: String, event_emitter: E) -> Self {
        Self {
            path,
            event_emitter,
            stop_tx: None,
            suppress_flag: Arc::new(AtomicBool::new(false)),
            thread_handle: None,
        }
    }

    /// Suppress the next file event (used for backend-initiated changes)
    pub fn suppress_next_event(&mut self) {
        debug!("Suppressing next event for {}", self.path);

        self.suppress_flag.store(true, Ordering::SeqCst);
        let _ = self.stop();
        let _ = self.start();
    }

    /// Start watching the file. Returns true if successful, false otherwise.
    pub fn start(&mut self) -> bool {
        if self.is_running() {
            debug!("Watcher already running for {}", self.path);
            return true;
        }

        match self.spawn_watcher_thread() {
            Ok((stop_tx, handle)) => {
                self.stop_tx = Some(stop_tx);
                self.thread_handle = Some(handle);
                debug!("Started watcher for {}", self.path);
                true
            }
            Err(e) => {
                debug!("Failed to start watcher for {}: {}", self.path, e);
                false
            }
        }
    }

    /// Stop the watcher and wait for the thread to finish
    pub fn stop(&mut self) -> Result<(), String> {
        if let Some(stop_tx) = self.stop_tx.take() {
            let _ = stop_tx.send(());
        }

        if let Some(handle) = self.thread_handle.take() {
            match handle.join() {
                Ok(_) => {
                    debug!("Stopped watcher for {}", self.path);
                    Ok(())
                }
                Err(e) => Err(format!("Watcher thread panicked: {:?}", e)),
            }
        } else {
            Ok(())
        }
    }

    /// Check if the watcher is currently running
    pub fn is_running(&self) -> bool {
        if let Some(ref handle) = self.thread_handle {
            !handle.is_finished()
        } else {
            false
        }
    }

    fn spawn_watcher_thread(
        &mut self,
    ) -> Result<(mpsc::Sender<()>, thread::JoinHandle<()>), String> {
        let watch_path = self.path.clone();
        let event_emitter = self.event_emitter.clone();
        let suppress_flag = self.suppress_flag.clone();
        let (stop_tx, stop_rx) = mpsc::channel::<()>();

        let handle = thread::spawn(move || {
            debug!("Starting file watcher thread for {}", watch_path);
            loop {
                if !std::path::Path::new(&watch_path).exists() {
                    debug!("File {} does not exist, waiting...", watch_path);
                    if Self::wait_with_stop_check(&stop_rx, Duration::from_millis(1000)) {
                        debug!("Stop signal received while waiting for file {}", watch_path);
                        return;
                    }
                    continue;
                }
                match Self::run_file_watcher(&watch_path, &event_emitter, &stop_rx, &suppress_flag)
                {
                    WatcherResult::Stopped => {
                        debug!("Watcher stopped for {}", watch_path);
                        return;
                    }
                    WatcherResult::FileRemoved => {
                        debug!("File {} was removed, will check for recreation", watch_path);
                    }
                    WatcherResult::Error(e) => {
                        debug!("Watcher error for {}: {}, retrying in 5s", watch_path, e);
                        if Self::wait_with_stop_check(&stop_rx, Duration::from_secs(5)) {
                            debug!("Stop signal received after error for {}", watch_path);
                            return;
                        }
                    }
                }
            }
        });
        Ok((stop_tx, handle))
    }

    fn run_file_watcher(
        watch_path: &str,
        event_emitter: &E,
        stop_rx: &mpsc::Receiver<()>,
        suppress_flag: &Arc<AtomicBool>,
    ) -> WatcherResult {
        debug!("Creating file watcher for {}", watch_path);
        let (tx, rx) = mpsc::channel();
        let watcher: NotifyResult<RecommendedWatcher> =
            notify::recommended_watcher(move |res: NotifyResult<Event>| {
                let _ = tx.send(res);
            });
        let mut watcher = match watcher {
            Ok(mut w) => {
                if let Err(e) = w.watch(
                    std::path::Path::new(watch_path),
                    RecursiveMode::NonRecursive,
                ) {
                    return WatcherResult::Error(format!("Failed to start watching: {}", e));
                }
                w
            }
            Err(e) => {
                return WatcherResult::Error(format!("Failed to create watcher: {}", e));
            }
        };
        let mut pending_event: Option<DebouncedEvent> = None;
        loop {
            match rx.recv_timeout(Duration::from_millis(100)) {
                Ok(event_res) => match event_res {
                    Ok(event) => {
                        debug!("Watcher event for {}: {:?}", watch_path, event);
                        match event.kind {
                            notify::EventKind::Modify(_) => {
                                debug!("File modified: {}, debouncing...", watch_path);
                                // If a remove event is already pending, keep it (remove always wins)
                                if let Some(ref debounced_event) = pending_event {
                                    if matches!(debounced_event.kind, notify::EventKind::Remove(_))
                                    {
                                        // Already pending remove, ignore modify
                                        continue;
                                    }
                                }
                                pending_event = Some(DebouncedEvent {
                                    kind: event.kind,
                                    timestamp: Instant::now(),
                                });
                            }
                            notify::EventKind::Remove(_) => {
                                debug!("File removed: {}, debouncing...", watch_path);
                                // Remove event always replaces any previous event
                                pending_event = Some(DebouncedEvent {
                                    kind: event.kind,
                                    timestamp: Instant::now(),
                                });
                            }
                            _ => {
                                debug!("Other file event for {}: {:?}", watch_path, event.kind);
                            }
                        }
                    }
                    Err(e) => {
                        debug!("Watcher error for {}: {}", watch_path, e);
                        return WatcherResult::Error(format!("Event error: {}", e));
                    }
                },
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    // Check for stop signal
                    if stop_rx.try_recv().is_ok() {
                        debug!("Stop signal received for watcher {}", watch_path);
                        let _ = watcher.unwatch(std::path::Path::new(watch_path));
                        return WatcherResult::Stopped;
                    }

                    // Check if we have a pending event that should be emitted
                    if let Some(ref debounced_event) = pending_event {
                        if debounced_event.timestamp.elapsed() >= DEBOUNCE_DURATION {
                            debug!("Debounce period elapsed, handling event for {}", watch_path);
                            // Suppress if flag is set
                            if suppress_flag.swap(false, Ordering::SeqCst) {
                                if let notify::EventKind::Remove(_) = &debounced_event.kind {
                                    return WatcherResult::FileRemoved;
                                }

                                debug!("Suppressing debounced event for {}", watch_path);
                                pending_event = None;

                                continue;
                            }
                            match debounced_event.kind {
                                notify::EventKind::Modify(_) => {
                                    event_emitter.send_event(ArchiveEventType::Reload, watch_path);
                                }
                                notify::EventKind::Remove(_) => {
                                    let _ = watcher.unwatch(std::path::Path::new(watch_path));
                                    event_emitter.send_event(ArchiveEventType::Reload, watch_path);

                                    return WatcherResult::FileRemoved;
                                }
                                _ => {
                                    // Other event types handled above
                                }
                            }
                            pending_event = None;
                        }
                    }
                    // Continue loop
                }
                Err(e) => {
                    debug!("Watcher receive error for {}: {:?}", watch_path, e);
                    return WatcherResult::Error(format!("Receive error: {:?}", e));
                }
            }
        }
    }

    /// Watch for creation of the file. Returns true if successful, false otherwise.
    pub fn watch_for_creation(&mut self) -> Result<bool, String> {
        if self.is_running() {
            debug!("Watcher already running for {}", self.path);
            return Ok(true);
        }

        match self.spawn_creation_watcher_thread() {
            Ok((stop_tx, handle)) => {
                self.stop_tx = Some(stop_tx);
                self.thread_handle = Some(handle);
                debug!("Started creation watcher for {}", self.path);
                Ok(true)
            }
            Err(e) => {
                debug!("Failed to start creation watcher for {}: {}", self.path, e);
                Err(e)
            }
        }
    }

    fn spawn_creation_watcher_thread(
        &self,
    ) -> Result<(mpsc::Sender<()>, thread::JoinHandle<()>), String> {
        let watch_path = self.path.clone();
        let event_emitter = self.event_emitter.clone();
        let (stop_tx, stop_rx) = mpsc::channel::<()>();

        // Find deepest existing parent directory
        let mut parent = std::path::Path::new(&watch_path);
        while !parent.exists() {
            if let Some(p) = parent.parent() {
                parent = p;
            } else {
                return Err("No existing parent directory found".to_string());
            }
        }
        let parent_dir = parent.to_path_buf();
        let file_name = std::path::Path::new(&watch_path)
            .file_name()
            .map(|f| f.to_os_string())
            .ok_or_else(|| "Invalid file name".to_string())?;

        let handle = thread::spawn(move || {
            debug!(
                "Starting creation watcher thread for {} in {:?}",
                watch_path, parent_dir
            );
            let (tx, rx) = mpsc::channel();
            let watcher: NotifyResult<RecommendedWatcher> =
                notify::recommended_watcher(move |res: NotifyResult<Event>| {
                    let _ = tx.send(res);
                });
            let mut watcher = match watcher {
                Ok(mut w) => {
                    if let Err(e) = w.watch(&parent_dir, RecursiveMode::NonRecursive) {
                        debug!("Failed to start watching parent dir: {}", e);
                        return;
                    }
                    w
                }
                Err(e) => {
                    debug!("Failed to create watcher: {}", e);
                    return;
                }
            };
            loop {
                match rx.recv_timeout(Duration::from_millis(100)) {
                    Ok(event_res) => match event_res {
                        Ok(event) => {
                            debug!("Creation watcher event for {:?}: {:?}", parent_dir, event);
                            if let notify::EventKind::Create(_) = event.kind {
                                for path in event.paths {
                                    if let Some(name) = path.file_name() {
                                        if name == file_name {
                                            debug!("File created: {:?}", path);
                                            event_emitter
                                                .send_event(ArchiveEventType::Created, &watch_path);
                                            let _ = watcher.unwatch(&parent_dir);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            debug!("Watcher error for {:?}: {}", parent_dir, e);
                            return;
                        }
                    },
                    Err(mpsc::RecvTimeoutError::Timeout) => {
                        if stop_rx.try_recv().is_ok() {
                            debug!("Stop signal received for creation watcher {:?}", parent_dir);
                            let _ = watcher.unwatch(&parent_dir);
                            return;
                        }
                    }
                    Err(e) => {
                        debug!("Watcher receive error for {:?}: {:?}", parent_dir, e);
                        return;
                    }
                }
            }
        });
        Ok((stop_tx, handle))
    }

    /// Wait for a duration while checking for stop signal
    fn wait_with_stop_check(stop_rx: &mpsc::Receiver<()>, duration: Duration) -> bool {
        let start = std::time::Instant::now();
        while start.elapsed() < duration {
            if stop_rx.try_recv().is_ok() {
                return true; // Stop signal received
            }
            thread::sleep(Duration::from_millis(100));
        }
        false // Timeout reached
    }
}

impl<E: ArchiveEventEmitter + Send + Sync + Clone + 'static> Drop for ArchiveWatcher<E> {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}

#[derive(Debug)]
enum WatcherResult {
    Stopped,
    FileRemoved,
    Error(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    /// Mock implementation of ArchiveEventEmitter for testing
    #[derive(Clone)]
    struct MockEventEmitter {
        events: Arc<Mutex<Vec<(ArchiveEventType, String)>>>,
    }

    impl MockEventEmitter {
        fn new() -> Self {
            Self {
                events: Arc::new(Mutex::new(Vec::new())),
            }
        }

        fn get_events(&self) -> Vec<(ArchiveEventType, String)> {
            self.events.lock().unwrap().clone()
        }
    }

    impl ArchiveEventEmitter for MockEventEmitter {
        fn send_event(&self, event_type: ArchiveEventType, path: &str) {
            self.events
                .lock()
                .unwrap()
                .push((event_type, path.to_string()));
        }
    }

    #[test]
    fn test_archive_watcher_creation() {
        let mock_emitter = MockEventEmitter::new();
        let watcher: ArchiveWatcher<MockEventEmitter> =
            ArchiveWatcher::new("test.cbz".to_string(), mock_emitter);
        assert!(!watcher.is_running());
    }

    #[test]
    fn test_mock_event_emitter() {
        let emitter = MockEventEmitter::new();

        assert_eq!(emitter.get_events().len(), 0);

        emitter.send_event(ArchiveEventType::Reload, "test.cbz");
        emitter.send_event(ArchiveEventType::Created, "other.cbz");

        let events = emitter.get_events();
        assert_eq!(events.len(), 2);
        assert_eq!(
            events[0],
            (ArchiveEventType::Reload, "test.cbz".to_string())
        );
        assert_eq!(
            events[1],
            (ArchiveEventType::Created, "other.cbz".to_string())
        );
    }

    #[test]
    fn test_watcher_event_simulation() {
        use std::fs;
        use std::path::Path;
        use std::thread;
        use std::time::Duration;

        let test_file = "tmp/test_watcher_simulation.cbz";

        // Ensure parent directory exists
        if let Some(parent) = Path::new(test_file).parent() {
            let _ = fs::create_dir_all(parent);
        }

        // Clean up any existing test file
        let _ = fs::remove_file(test_file);

        let mock_emitter = MockEventEmitter::new();
        let mut watcher: ArchiveWatcher<MockEventEmitter> =
            ArchiveWatcher::new(test_file.to_string(), mock_emitter.clone());

        // Create the test file
        fs::write(test_file, b"initial content").expect("Failed to create test file");

        // Start the watcher
        assert!(watcher.start(), "Failed to start watcher");
        assert!(watcher.is_running(), "Watcher should be running");

        // Give the watcher time to initialize
        thread::sleep(Duration::from_millis(200));

        // Modify the file
        fs::write(test_file, b"modified content").expect("Failed to modify file");

        // Wait for debounce period to elapse
        thread::sleep(Duration::from_millis(1200));

        // Check if the event was emitted
        let events = mock_emitter.get_events();
        assert!(
            !events.is_empty(),
            "Should have received at least one event"
        );
        assert_eq!(
            events[0],
            (ArchiveEventType::Reload, test_file.to_string()),
            "Event should be for the test file"
        );

        // Remove the file
        fs::remove_file(test_file).expect("Failed to remove test file");

        // Wait a bit for the remove event to be processed
        thread::sleep(Duration::from_millis(200));

        // The watcher should have stopped due to file removal
        // Note: The watcher thread may still be running briefly while waiting for file recreation
        // but the file watching loop should have exited

        // Stop the watcher
        let stop_result = watcher.stop();
        assert!(stop_result.is_ok(), "Failed to stop watcher");

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_watcher_file_removal_and_recreation() {
        use std::fs;
        use std::path::Path;
        use std::thread;
        use std::time::Duration;

        let test_file = "tmp/test_removal_recreation.cbz";

        // Ensure parent directory exists
        if let Some(parent) = Path::new(test_file).parent() {
            let _ = fs::create_dir_all(parent);
        }

        // Clean up any existing test file
        let _ = fs::remove_file(test_file);

        let mock_emitter = MockEventEmitter::new();
        let mut watcher: ArchiveWatcher<MockEventEmitter> =
            ArchiveWatcher::new(test_file.to_string(), mock_emitter.clone());

        // Create the test file
        fs::write(test_file, b"initial content").expect("Failed to create test file");

        // Start the watcher
        assert!(watcher.start(), "Failed to start watcher");

        // Give the watcher time to initialize
        thread::sleep(Duration::from_millis(200));

        // Remove the file
        fs::remove_file(test_file).expect("Failed to remove test file");

        // Wait for the remove event to be processed
        thread::sleep(Duration::from_millis(200));

        // Recreate the file
        fs::write(test_file, b"recreated content").expect("Failed to recreate test file");

        // Wait for the watcher to detect the recreation and potentially emit events
        thread::sleep(Duration::from_millis(1200));

        // Check events - should have at least one event for the removal
        let events = mock_emitter.get_events();
        assert!(!events.is_empty(), "Should have received events");

        // Stop the watcher
        let stop_result = watcher.stop();
        assert!(stop_result.is_ok(), "Failed to stop watcher");

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_watcher_file_creation_notification() {
        use std::fs;
        use std::path::Path;
        use std::thread;
        use std::time::Duration;

        let test_file = "tmp/test_creation_notification.cbz";

        // Ensure parent directory exists
        if let Some(parent) = Path::new(test_file).parent() {
            let _ = fs::create_dir_all(parent);
        }

        // Clean up any existing test file
        let _ = fs::remove_file(test_file);

        let mock_emitter = MockEventEmitter::new();
        let mut watcher: ArchiveWatcher<MockEventEmitter> =
            ArchiveWatcher::new(test_file.to_string(), mock_emitter.clone());

        // Start the watcher for creation (file does not exist yet)
        assert!(
            watcher.watch_for_creation().unwrap(),
            "Failed to start creation watcher"
        );
        assert!(watcher.is_running(), "Watcher should be running");

        // Wait a bit to ensure watcher is waiting for file creation
        thread::sleep(Duration::from_millis(500));

        // Create the file
        fs::write(test_file, b"created content").expect("Failed to create test file");

        // Wait for event propagation
        thread::sleep(Duration::from_millis(1200));

        // Check if the event was emitted
        let events = mock_emitter.get_events();
        assert!(
            events
                .iter()
                .any(|(ty, path)| ty == &ArchiveEventType::Created && path == test_file),
            "Should have received archive-created event for file creation"
        );

        // Stop the watcher
        let stop_result = watcher.stop();
        assert!(stop_result.is_ok(), "Failed to stop watcher");

        // Clean up
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_suppress_next_event_blocks_event_emission() {
        use std::fs;
        use std::path::Path;
        use std::thread;
        use std::time::Duration;

        let test_file = "tmp/test_suppress_event.cbz";

        // Ensure parent directory exists
        if let Some(parent) = Path::new(test_file).parent() {
            let _ = fs::create_dir_all(parent);
        }
        // Clean up any existing test file
        let _ = fs::remove_file(test_file);

        let mock_emitter = MockEventEmitter::new();
        let mut watcher: ArchiveWatcher<MockEventEmitter> =
            ArchiveWatcher::new(test_file.to_string(), mock_emitter.clone());

        // Suppress next event BEFORE starting the watcher
        // watcher.suppress_next_event();

        // Create the test file
        fs::write(test_file, b"initial content").expect("Failed to create test file");

        // Start the watcher
        assert!(watcher.start(), "Failed to start watcher");
        assert!(watcher.is_running(), "Watcher should be running");

        // Give the watcher time to initialize
        thread::sleep(Duration::from_millis(200));

        // Suppress next event BEFORE modifying the file
        watcher.suppress_next_event();

        // Modify the file
        fs::write(test_file, b"modified content").expect("Failed to modify file");

        // Wait for debounce period to elapse
        thread::sleep(Duration::from_millis(1200));

        // Check that no event was emitted
        let events = mock_emitter.get_events();
        assert!(
            events.is_empty(),
            "No event should be emitted after suppression"
        );

        // Clean up
        let _ = watcher.stop();
        let _ = fs::remove_file(test_file);
    }

    #[test]
    fn test_suppress_next_event_blocks_event_emission_multiple() {
        for _ in 0..5 {
            use std::fs;
            use std::path::Path;
            use std::thread;
            use std::time::Duration;

            let test_file = "tmp/test_suppress_event_multiple.cbz";

            // Ensure parent directory exists
            if let Some(parent) = Path::new(test_file).parent() {
                let _ = fs::create_dir_all(parent);
            }
            // Clean up any existing test file
            let _ = fs::remove_file(test_file);

            let mock_emitter = MockEventEmitter::new();
            let mut watcher: ArchiveWatcher<MockEventEmitter> =
                ArchiveWatcher::new(test_file.to_string(), mock_emitter.clone());

            // Suppress next event BEFORE starting the watcher
            // watcher.suppress_next_event();

            // Create the test file
            fs::write(test_file, b"initial content").expect("Failed to create test file");

            // Start the watcher
            assert!(watcher.start(), "Failed to start watcher");
            assert!(watcher.is_running(), "Watcher should be running");

            // Give the watcher time to initialize
            thread::sleep(Duration::from_millis(200));

            // Suppress next event BEFORE modifying the file
            watcher.suppress_next_event();

            // Modify the file
            fs::write(test_file, b"modified content").expect("Failed to modify file");

            // Wait for debounce period to elapse
            thread::sleep(Duration::from_millis(1200));

            // Check that no event was emitted
            let events = mock_emitter.get_events();
            assert!(
                events.is_empty(),
                "No event should be emitted after suppression"
            );

            // Clean up
            let _ = watcher.stop();
            let _ = fs::remove_file(test_file);
        }
    }
}
