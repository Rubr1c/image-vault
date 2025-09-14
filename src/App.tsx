import { useEffect, useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const [files, setFiles] = useState<string[]>();

  async function getFiles() {
    setFiles(await invoke('get_files'));
  }

  return (
    <main>
      <button className="text-red-300" onClick={getFiles}>
        Cold
      </button>
      {files &&
        files.length > 0 &&
        files.map((file) => <div key={file}>file</div>)}
    </main>
  );
}

export default App;
