import { useEffect, useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import Image from './components/image';
import { ImageData } from './types/image';
import AddButton from './components/add-button';
import AddImageModal from './components/add-image-modal';

function App() {
  const [images, setImages] = useState<ImageData[]>();
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    invoke<ImageData[]>('get_images').then(setImages).catch(console.error);
  }, []);

  return (
    <main className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images &&
          images.length > 0 &&
          images.map((image) => <Image key={image.id} image={image} />)}
      </div>
      <AddButton onClick={() => setShowModal(true)} />
      {showModal && <AddImageModal onClose={() => setShowModal(false)} />}
    </main>
  );
}

export default App;
