import { useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import Image from './components/image';
import { ImageData } from './types/image';

function App() {
  const [images, setImages] = useState<ImageData[]>();

  async function getImages() {
    setImages(await invoke('get_images'));
    console.log(images);
  }

  return (
    <main>
      <button className="text-red-300" onClick={getImages}>
        Cold
      </button>
      {images &&
        images.length > 0 &&
        images.map((image) => <Image image={image} />)}
    </main>
  );
}

export default App;
