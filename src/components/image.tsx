import { convertFileSrc } from '@tauri-apps/api/core';
import { ImageData } from '../types/image';

export interface ImageProps {
  image: ImageData;
  className?: string;
  setSelectedImage: (image: ImageData) => void;
}

export default function Image({ image, className = '', setSelectedImage }: ImageProps) {

  return (
    <div className={`aspect-square overflow-hidden rounded-lg ${className}`}>
      <img
        src={convertFileSrc(image.path)}
        alt={image.filename}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        onClick={() => setSelectedImage(image)}
      />
    </div>
  );
}
