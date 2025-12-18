import { useRef, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface ProcessInfo {
  id: string;
  name: string;
  pid: number;
  port?: number;
  command: string;
  status: 'running' | 'stopped';
}

function App() {
  const [selectedAppSearch, setSelectedAppSearch] = useState("");
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const TypeRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleKeyPress = () => {
      TypeRef.current?.focus();
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, []);

  const fetchProcesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('get_running_processes');
      setProcesses(result as ProcessInfo[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch processes');
    } finally {
      setLoading(false);
    }
  };

  const killProcess = async (pid: number) => {
    try {
      await invoke('kill_process', { pid });
      await fetchProcesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to kill process');
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = 
      process.name.toLowerCase().includes(selectedAppSearch.toLowerCase()) ||
      process.command.toLowerCase().includes(selectedAppSearch.toLowerCase()) ||
      (process.port && process.port.toString().includes(selectedAppSearch)) ||
      process.pid.toString().includes(selectedAppSearch);
    
    const matchesStatus = statusFilter === 'all' || process.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  return (
    <>
      <div>
        <h1>Kill your ports Easily</h1>
      <div style={{display: 'flex', alignItems:'center', justifyContent:'center', gap: '10px'}}>
  <input
    ref={TypeRef}
    style={{ width: "80%", padding: "10px", borderRadius: "5px" }}
    placeholder="write app name (e.g. node, python3, docker, vlc, code etc...)"
    type="text"
    value={selectedAppSearch}
    onChange={(e) => setSelectedAppSearch(e.target.value)}
  />
  <button onClick={fetchProcesses} disabled={loading} style={{padding: "10px", borderRadius: "5px"}}>
    Refresh
  </button>
</div>
      </div>
      <div className="container">
     
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={fetchProcesses}>Retry</button>
          </div>
        )}
        
        {loading && (
          <div className="loading">
            <p>Loading processes...</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="process-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Process ID</th>
                  <th>Port</th>
                  <th>Command</th>
                  <th style={{'display': "flex", gap:"5px"}} > <span>
                    
                    </span>
                       <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
              title="Show All"
              style={{'display':"flex", }}
            >
                <span>
                  ▲ 
                  </span>
                <span>▼ </span>
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'running' ? 'active' : ''}`}
              onClick={() => setStatusFilter('running')}
              title="Show Running Only"
            >
              ▲ 
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'stopped' ? 'active' : ''}`}
              onClick={() => setStatusFilter('stopped')}
              title="Show Stopped Only"
            >
              ▼ 
            </button></th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcesses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      {selectedAppSearch ? 'No processes found matching your search' : 'No processes found'}
                    </td>
                  </tr>
                ) : (
                  filteredProcesses.map((process) => (
                    <tr key={process.id}>
                      <td className="truncate-text">{process.name}</td>
                      <td>{process.pid}</td>
                      <td>{process.port || '-'}</td>
                      <td className="command-cell">
                        <span className="truncate-text" title={process.command}>
                          {process.command}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${process.status}`}>
                          {process.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => killProcess(process.pid)}
                          className="kill-button"
                          disabled={process.status === 'stopped'}
                        >
                          Kill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="refresh-section">
          <button onClick={fetchProcesses} disabled={loading}>
            Refresh Processes
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
