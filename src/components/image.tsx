import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ImageData } from '../types/image';
import { useToast } from './toast';

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
  const { showToast } = useToast();
  function handleDelete() {
    invoke('delete_image', { imageId: image.id });
    onDelete();
  }

  async function copyImageToClipboard(path: string) {
    try {
      // Show immediate feedback, then perform copy
      showToast('Copying…', 'info', 800);
      await invoke('copy_image_to_clipboard', { path });
      showToast('Image copied to clipboard', 'success');
    } catch (err) {
      console.error('Failed to copy image:', err);
      showToast('Failed to copy image', 'error');
    }
  }

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-xl shadow border border-gray-200 group bg-white ${className}`}
    >
      {/* Image */}
      <img
        src={convertFileSrc(image.path)}
        alt={image.filename}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer select-none"
        onClick={() => setSelectedImage(image)}
        draggable={false}
      />

      {/* Gradient overlay + filename */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0">
        <div className="text-xs text-white/90 truncate" title={image.filename}>
          {image.filename}
        </div>
      </div>

      {/* Action buttons (top-right), individually positioned */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/90 text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-105 z-10"
        title="Delete"
        type="button"
        aria-label="Delete"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        onClick={() => copyImageToClipboard(image.path)}
        className="absolute top-2 right-12 inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/90 text-white shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-105 z-10"
        title="Copy image to clipboard"
        type="button"
        aria-label="Copy"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
    </div>
  );
}
