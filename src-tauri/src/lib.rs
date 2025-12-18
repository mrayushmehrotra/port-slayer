use serde::Serialize;
use sysinfo::{ProcessStatus, System};

#[derive(Serialize)]
struct ProcessInfo {
    id: String,
    name: String,
    pid: u32,
    port: Option<u32>,
    command: String,
    status: String,
}

#[tauri::command]
fn get_running_processes() -> Vec<ProcessInfo> {
    let mut system = System::new_all();
    system.refresh_all();
    
    let mut processes = Vec::new();
    
    for (pid, process) in system.processes() {
        let status = match process.status() {
            ProcessStatus::Run => "running",
            ProcessStatus::Sleep => "running",
            ProcessStatus::Dead => "stopped",
            ProcessStatus::Zombie => "stopped",
            _ => "stopped",
        };
        
        processes.push(ProcessInfo {
            id: pid.to_string(),
            name: process.name().to_string(),
            pid: pid.as_u32(),
            port: None, // We'll need additional logic to get port info
            command: process.cmd().join(" "),
            status: status.to_string(),
        });
    }
    
    processes
}

#[tauri::command]
fn kill_process(pid: u32) -> Result<String, String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("taskkill")
            .args(&["/F", "/PID", &pid.to_string()])
            .output();
            
        match output {
            Ok(_) => Ok(format!("Process {} killed successfully", pid)),
            Err(e) => Err(format!("Failed to kill process: {}", e)),
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("kill")
            .args(&["-9", &pid.to_string()])
            .output();
            
        match output {
            Ok(_) => Ok(format!("Process {} killed successfully", pid)),
            Err(e) => Err(format!("Failed to kill process: {}", e)),
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_running_processes,
            kill_process,
            greet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
