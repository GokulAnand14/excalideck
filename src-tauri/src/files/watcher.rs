use notify_debouncer_full::{new_debouncer_opt, Debouncer, NoCache};
use notify::{Config, RecommendedWatcher, RecursiveMode};
use std::path::Path;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub fn start_watcher(
    path: &Path,
    app_handle: AppHandle,
) -> Result<Debouncer<RecommendedWatcher, NoCache>, String> {
    let mut debouncer = new_debouncer_opt::<_, RecommendedWatcher, NoCache>(
        Duration::from_millis(500),
        None,
        move |res: notify_debouncer_full::DebounceEventResult| {
            match res {
                Ok(events) => {
                    for event in events {
                        for path in &event.paths {
                            let path_str = path.to_string_lossy().to_string();

                            use notify::EventKind;
                            match event.kind {
                                EventKind::Create(_) => {
                                    let _ = app_handle.emit(
                                        "vault-file-created",
                                        serde_json::json!({ "path": path_str }),
                                    );
                                }
                                EventKind::Modify(_) => {
                                    let _ = app_handle.emit(
                                        "vault-file-modified",
                                        serde_json::json!({ "path": path_str }),
                                    );
                                }
                                EventKind::Remove(_) => {
                                    let _ = app_handle.emit(
                                        "vault-file-deleted",
                                        serde_json::json!({ "path": path_str }),
                                    );
                                }
                                _ => {}
                            }
                        }
                    }
                }
                Err(errs) => {
                    for e in errs {
                        eprintln!("File watcher error: {:?}", e);
                    }
                }
            }
        },
        NoCache,
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watch(path, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    Ok(debouncer)
}
