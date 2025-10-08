use super::watcher::ArchiveWatcher;
use log::debug;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::AppHandle;

/// Global manager for all archive watchers
static WATCHER_MANAGER: Lazy<Mutex<WatcherManager>> =
    Lazy::new(|| Mutex::new(WatcherManager::new()));

/// Manages multiple ArchiveWatcher instances
pub struct WatcherManager {
    watchers: HashMap<String, ArchiveWatcher<AppHandle>>,
}

impl WatcherManager {
    fn new() -> Self {
        Self {
            watchers: HashMap::new(),
        }
    }

    /// Start watching a file. If already watching, restart the watcher.
    fn start_watching(&mut self, path: String, app_handle: AppHandle) -> bool {
        // Clean up any dead watchers first
        self.cleanup_dead_watchers();

        // Remove existing watcher if it exists (this will stop it via Drop)
        self.watchers.remove(&path);

        // Create and start new watcher
        let mut watcher = ArchiveWatcher::new(path.clone(), app_handle);
        if watcher.start() {
            self.watchers.insert(path, watcher);
            true
        } else {
            false
        }
    }

    fn start_watching_for_creation(&mut self, path: String, app_handle: AppHandle) -> bool {
        // Clean up any dead watchers first
        self.cleanup_dead_watchers();

        // Remove existing watcher if it exists (this will stop it via Drop)
        self.watchers.remove(&path);

        // Create and start new watcher
        let mut watcher = ArchiveWatcher::new(path.clone(), app_handle);
        match watcher.watch_for_creation() {
            Ok(started) => {
                if started {
                    self.watchers.insert(path, watcher);
                    true
                } else {
                    false
                }
            }
            Err(_) => false,
        }
    }

    /// Stop watching a specific file
    fn stop_watching(&mut self, path: &str) -> Result<(), String> {
        if let Some(mut watcher) = self.watchers.remove(path) {
            watcher.stop()
        } else {
            debug!("No watcher found for path: {}", path);
            Ok(())
        }
    }

    /// Suppress the next event for a given path
    pub fn suppress_next_event(&mut self, path: &str) {
        if let Some(watcher) = self.watchers.get_mut(path) {
            watcher.suppress_next_event();
        }
    }

    /// Clean up any watchers that are no longer running
    fn cleanup_dead_watchers(&mut self) {
        let dead_paths: Vec<String> = self
            .watchers
            .iter()
            .filter(|(_, watcher)| !watcher.is_running())
            .map(|(path, _)| path.clone())
            .collect();

        for path in dead_paths {
            debug!("Cleaning up dead watcher for: {}", path);
            self.watchers.remove(&path);
        }
    }
}

/// Public API functions for managing watchers
/// Start watching an archive file. If already watching, the watcher will be restarted.
pub fn start_archive_watcher(path: String, app_handle: AppHandle) -> bool {
    match WATCHER_MANAGER.lock() {
        Ok(mut manager) => {
            debug!("Starting archive watcher for: {}", path);
            manager.start_watching(path, app_handle)
        }
        Err(e) => {
            debug!("Failed to acquire watcher manager lock: {}", e);
            false
        }
    }
}

pub fn start_archive_watch_for_creation(app: tauri::AppHandle, path: String) -> bool {
    match WATCHER_MANAGER.lock() {
        Ok(mut manager) => {
            debug!("Starting archive watcher for: {}", path);
            manager.start_watching_for_creation(path, app);
            true
        }
        Err(e) => {
            debug!("Failed to acquire watcher manager lock: {}", e);
            false
        }
    }
}

/// Stop watching an archive file
pub fn stop_archive_watcher(path: &str) -> Result<(), String> {
    match WATCHER_MANAGER.lock() {
        Ok(mut manager) => {
            debug!("Stopping archive watcher for: {}", path);
            manager.stop_watching(path)
        }
        Err(e) => {
            let msg = format!("Failed to acquire watcher manager lock: {}", e);
            debug!("{}", msg);
            Err(msg)
        }
    }
}

/// Public API to suppress next event for a path
pub fn suppress_next_archive_event(path: &str) {
    if let Ok(mut manager) = WATCHER_MANAGER.lock() {
        manager.suppress_next_event(path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_watcher_manager_creation() {
        let manager = WatcherManager::new();
        // Just verify the manager can be created
        assert!(manager.watchers.is_empty());
    }

    #[test]
    fn test_api_functions_exist() {
        // Just verify the public API functions exist with correct signatures
        let _: fn(String, AppHandle) -> bool = start_archive_watcher;
        let _: fn(&str) -> Result<(), String> = stop_archive_watcher;
    }
}
