import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

export default function AddImageModal({
  onClose,
  onAddImage,
}: {
  onClose: () => void;
  onAddImage: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local');
  const [path, setPath] = useState<string>('');
  const [options, setOptions] = useState<{
    moveImage: boolean;
    target: 'file' | 'folder';
  }>({
    moveImage: false,
    target: 'file',
  });
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [urlOrPath, setUrlOrPath] = useState<string>('');
  const [isPath, setIsPath] = useState<boolean>(false); // when true, treat urlOrPath as a path to a text file containing URLs

  async function handleAddImage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (options.target === 'file') {
      await invoke('save_image_from_path', {
        path,
        moveImage: options.moveImage,
      });
    } else {
      await invoke('save_image_from_folder', {
        path,
        moveImage: options.moveImage,
      });
    }
    onAddImage();
    onClose();
  }

  async function handleFetchImage() {
    if (isPath) {
      await invoke('fetch_and_save_from_file', {
        path: urlOrPath,
      });
    } else {
      await invoke('fetch_and_save_image', {
        urlOrPath,
      });
    }
    onAddImage();
    onClose();
  }

  useEffect(() => {
    const unlisten = listen<[number, number]>(
      'save_images_progress',
      ({ payload }) => {
        const [count, total] = payload;
        setProgress(count);
        setTotal(total);
      }
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 transform transition-all duration-200 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add Images</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Close"
            type="button"
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

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="inline-flex rounded-lg p-1 bg-gray-100 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('local')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'local' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Local
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remote')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'remote' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Remote
            </button>
          </div>
        </div>

        {/* Content */}
        <form className="p-6 space-y-6" onSubmit={handleAddImage}>
          {activeTab === 'local' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Path to {options.target === 'file' ? 'Image File' : 'Folder'}
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder={options.target === 'file' ? 'C:/images/photo.jpg' : 'C:/images/'}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
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
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 ml-auto">
                  <input
                    type="checkbox"
                    checked={options.moveImage}
                    onChange={(e) => setOptions({ ...options, moveImage: e.target.checked })}
                  />
                  Move into vault
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isPath ? 'Path to text file with URLs' : 'Image URL'}
                </label>
                <input
                  type="text"
                  placeholder={isPath ? 'C:/downloads/urls.txt' : 'https://example.com/image.jpg'}
                  value={urlOrPath}
                  onChange={(e) => setUrlOrPath(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <div className="mt-2 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={isPath}
                      onChange={(e) => setIsPath(e.target.checked)}
                    />
                    Import from a local .txt file of URLs
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchImage}
                    disabled={!urlOrPath.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Fetch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-[width] duration-300"
                style={{ width: total > 0 ? `${Math.round((progress / Math.max(total, 1)) * 100)}%` : '0%' }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">{progress}/{total}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            {activeTab === 'local' && (
              <button
                type="submit"
                disabled={!path.trim()}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
