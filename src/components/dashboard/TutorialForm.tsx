import React from 'react';
import { Category } from '../../types';
import { BlockEditor } from './blocks/BlockEditor';
import { ImageBlock } from './blocks/ImageBlock';
import { TagPicker } from './TagPicker';
import { TutorialBlock, User } from '../../types';

interface TutorialFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  vipUsers?: User[];
}

export function TutorialForm({
  onSubmit,
  initialData,
  vipUsers = []
}: TutorialFormProps) {
  const categories: Category[] = ['wordpress', 'elementor', 'gravity-forms', 'shopify', 'general'];
  const [blocks, setBlocks] = React.useState<TutorialBlock[]>(initialData?.blocks || []);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(initialData?.tags || []);
  const [isVipOnly, setIsVipOnly] = React.useState(initialData?.vipOnly || false);
  const [selectedVipUsers, setSelectedVipUsers] = React.useState<string[]>(initialData?.vipUsers || []);
  const availableTags = React.useMemo(() => [
    { id: '1', name: 'wordpress' },
    { id: '2', name: 'tutorial' },
    { id: '3', name: 'beginner' },
    { id: '4', name: 'advanced' },
    { id: '5', name: 'tips' },
    { id: '6', name: 'guide' },
  ], []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      blocks,
      image: formData.get('image'),
      videoUrl: formData.get('videoUrl'),
      tags: selectedTags,
      vipOnly: isVipOnly,
      vipUsers: selectedVipUsers,
      updatedAt: new Date().toISOString(),
      id: initialData?.id || Date.now().toString(),
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          defaultValue={initialData?.title}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-base"
          placeholder="Enter tutorial title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          defaultValue={initialData?.description}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-base"
          placeholder="Enter a brief description of the tutorial"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={initialData?.category}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-base"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Tutorial Content
        </label>
        <div>
          <BlockEditor
            blocks={blocks}
            onChange={setBlocks}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Highlight Image
        </label>
        <ImageBlock
          value={initialData?.image || ''}
          onChange={(content) => {
            const imageInput = document.createElement('input');
            imageInput.type = 'hidden';
            imageInput.name = 'image';
            imageInput.value = content;
            const oldInput = document.querySelector('input[name="image"]');
            if (oldInput) {
              oldInput.remove();
            }
            document.querySelector('form')?.appendChild(imageInput);
          }}
        />
      </div>

      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Highlight Video (optional)
        </label>
        <input
          type="url"
          name="videoUrl"
          id="videoUrl"
          defaultValue={initialData?.videoUrl}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-base"
          placeholder="Enter YouTube embed URL (e.g., https://www.youtube.com/embed/...)"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <TagPicker
          selectedTags={selectedTags}
          onChange={setSelectedTags}
          availableTags={availableTags}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="vipOnly"
            checked={isVipOnly}
            onChange={(e) => setIsVipOnly(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="vipOnly" className="text-sm font-medium text-gray-700">
            VIP-Only Tutorial
          </label>
        </div>

        {isVipOnly && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select VIP Users
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              {vipUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedVipUsers.includes(user.id)}
                    onChange={(e) => {
                      setSelectedVipUsers(
                        e.target.checked
                          ? [...selectedVipUsers, user.id]
                          : selectedVipUsers.filter(id => id !== user.id)
                      );
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`user-${user.id}`} className="text-sm text-gray-700">
                    {user.name} ({user.email})
                  </label>
                </div>
              ))}
              {vipUsers.length === 0 && (
                <p className="text-sm text-gray-500 p-2">No VIP users found</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onSubmit(null)}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors"
        >
          Save Tutorial
        </button>
      </div>
    </form>
  );
}