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

  async function handleAddTag() {
    const raw = tag.trim();
    if (!raw) return;
    // Support adding multiple tags separated by space or comma
    const parts = Array.from(new Set(raw.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean)));
    if (parts.length === 0) return;
    try {
      await Promise.all(
        parts.map((t) =>
          invoke('add_tag', {
            imageId: image.id,
            newTag: t,
          })
        )
      );
      setTags((prev) => Array.from(new Set([...prev, ...parts])));
      setTag('');
    } catch (error) {
      console.error('Failed to add tag(s):', error);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  }

  async function handleOCRRetry() {
    try {
      await invoke('ocr_retry', { imageId: image.id });
      invoke<string[]>('get_tags', { imageId: image.id })
        .then(setTags)
        .catch(console.error);
    } catch (error) {
      console.error('Failed to retry OCR:', error);
    }
  }

  async function handleRemoveTag(tag: string) {
    try {
      await invoke('remove_tag', { imageId: image.id, tag });
      setTags(tags.filter((t) => t !== tag));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl max-h-[90vh] w-full overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate" title={image.filename}>
              {image.filename}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Added {new Date(image.added_at).toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            aria-label="Close"
            type="button"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className="max-w-full max-h-full object-contain rounded-lg shadow"
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-96 border-l border-gray-200 flex flex-col">
            {/* Actions Section */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleOCRRetry}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium cursor-pointer"
                >
                  Retry OCR
                </button>
              </div>
            </div>

            {/* Tags Section */}
            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tags</h2>

              {/* Tags Display */}
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.length > 0 ? (
                  tags.map((tagItem, index) => (
                    <span
                      key={`${tagItem}-${index}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200"
                    >
                      {tagItem}
                      <button
                        onClick={() => handleRemoveTag(tagItem)}
                        className="ml-2 p-1 hover:bg-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label={`Remove ${tagItem}`}
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No tags yet</p>
                )}
              </div>

              {/* Add Tag Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Add Tag(s)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type tags separated by space or comma, then press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tag.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
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
                type="button"
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
