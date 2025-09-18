import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export default function AddImageModal({
  onClose,
  onAddImage,
}: {
  onClose: () => void;
  onAddImage: () => void;
}) {
  const [path, setPath] = useState<string>('');
  const [options, setOptions] = useState<{
    moveImage: boolean;
    target: 'file' | 'folder';
  }>({
    moveImage: false,
    target: 'file',
  });

  async function handleAddImage() {
    if (options.target === 'file') {
      await invoke('save_image_from_path', {
        path,
        moveImage: options.moveImage,
      });
    } else {
      //TODO: Implement folder support
    }
    onAddImage();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Image</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <svg
              className="w-5 h-5 text-gray-500"
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
        <form className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Image Path
            </label>
            <div className="relative">
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Enter image path..."
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={options.moveImage}
                  onChange={(e) =>
                    setOptions({ ...options, moveImage: e.target.checked })
                  }
                />
                Move Image
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <input
                  type="radio"
                  checked={options.target === 'file'}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      target: e.target.checked ? 'file' : 'folder',
                    })
                  }
                />
                File
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <input
                  type="radio"
                  checked={options.target === 'folder'}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      target: e.target.checked ? 'folder' : 'file',
                    })
                  }
                />
                Folder
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Supported formats: JPG, PNG, GIF, WebP
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              onClick={handleAddImage}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium shadow-lg hover:shadow-xl cursor-pointer"
            >
              Add Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
