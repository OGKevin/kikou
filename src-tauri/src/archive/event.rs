use log::debug;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ArchiveEventType {
    Reload,
    Created,
}

impl ArchiveEventType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ArchiveEventType::Reload => "reload-archive",
            ArchiveEventType::Created => "archive-created",
        }
    }
}

pub trait ArchiveEventEmitter {
    fn send_event(&self, event_type: ArchiveEventType, path: &str);
}

impl ArchiveEventEmitter for AppHandle {
    fn send_event(&self, event_type: ArchiveEventType, path: &str) {
        if let Err(e) = self.emit(event_type.as_str(), path) {
            debug!("Failed to emit {} event: {}", event_type.as_str(), e);
        }
    }
}
