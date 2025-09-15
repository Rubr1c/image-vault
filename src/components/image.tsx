import { convertFileSrc } from '@tauri-apps/api/core';
import { ImageData } from '../types/image';

export default function Image({ image }: { image: ImageData }) {
  return <img src={convertFileSrc(image.path)} alt={image.filename} />;
}
