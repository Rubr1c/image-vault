import { useEffect, useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import Image from './components/image';
import { ImageData } from './types/image';

function App() {
  const [images, setImages] = useState<ImageData[]>();

  useEffect(() => {
    invoke<ImageData[]>('get_images').then(setImages).catch(console.error);
  }, []);

  return (
    <main>
      {images &&
        images.length > 0 &&
        images.map((image) => <Image key={image.id} image={image} />)}
    </main>
  );
}

export default App;
