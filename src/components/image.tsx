import { ImageData } from '../types/image';

export default function Image({ image }: { image: ImageData }) {
  return (
    <div key={image.id} className="text-green-950">
      {image.filename}
    </div>
  );
}
