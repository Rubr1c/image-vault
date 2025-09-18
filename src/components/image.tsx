import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ImageData } from '../types/image';

export interface ImageProps {
  image: ImageData;
  className?: string;
  setSelectedImage: (image: ImageData) => void;
  onDelete: () => void;
}

export default function Image({
  image,
  className = '',
  setSelectedImage,
  onDelete,
}: ImageProps) {
  function handleDelete() {
    invoke('delete_image', { imageId: image.id });
    onDelete();
  }

  async function copyImageToClipboard(path: string) {
    //TODO: make it keep original image format
    const response = await fetch(path);
    const blob = await response.blob();

    const img = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context failed');
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/png')
    );

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': pngBlob,
      }),
    ]);

  }

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-lg shadow-md border border-gray-200 group ${className}`}
    >
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 bg-red-500/90 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        title="Delete image"
        type="button"
      >
        Delete
      </button>
      <img
        src={convertFileSrc(image.path)}
        alt={image.filename}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer"
        onClick={() => setSelectedImage(image)}
        draggable={false}
      />
      <button
        onClick={() => copyImageToClipboard(convertFileSrc(image.path))}
        className="absolute bottom-2 left-2 z-10 bg-blue-500/90 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="Copy image"
        type="button"
      >
        Copy Image
      </button>
    </div>
  );
}
