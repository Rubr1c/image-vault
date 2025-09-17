import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { ImageData } from '../types/image';
import { useEffect, useState } from 'react';

export default function ImageModal({
  image,
  onClose,
}: {
  image: ImageData;
  onClose: () => void;
}) {
  const [tag, setTag] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    invoke<string[]>('get_tags', { imageId: image.id })
      .then(setTags)
      .catch(console.error);
  }, [image.id]);

  const handleAddTag = async () => {
    if (tag.trim()) {
      try {
        await invoke('add_tag', {
          imageId: image.id,
          newTag: tag.trim(),
        });
        setTags([...tags, tag.trim()]);
        setTag('');
      } catch (error) {
        console.error('Failed to add tag:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {image.filename}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Added {new Date(image.added_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-140px)]">
          {/* Image Section */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
            <img
              src={convertFileSrc(image.path)}
              alt={image.filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 border-l border-gray-200 flex flex-col">
            {/* Tags Section */}
            <div className="p-6 flex-1">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tags</h2>

              {/* Tags Display */}
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.length > 0 ? (
                  tags.map((tagItem, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tagItem}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No tags yet</p>
                )}
              </div>

              {/* Add Tag Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Add New Tag
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter tag name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tag.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
