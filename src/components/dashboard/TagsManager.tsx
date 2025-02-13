import React, { useState } from 'react';
import { Plus, X, Save, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Tag {
  id: string;
  name: string;
  count: number;
}

function SortableTag({ tag, onEdit, onDelete, isEditing, editValue, onEditChange, onSave }: {
  tag: Tag;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
    >
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1 mr-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-1"
          />
          <button
            onClick={onSave}
            className="p-1 text-green-600 hover:text-green-700"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 hover:bg-gray-100 rounded"
          >
            ⋮⋮
          </div>
          <span className="text-gray-900">{tag.name}</span>
          <span className="text-sm text-gray-500">({tag.count} articles)</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {!isEditing && (
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-indigo-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([
    { id: '1', name: 'wordpress', count: 5 },
    { id: '2', name: 'tutorial', count: 3 },
    { id: '3', name: 'beginner', count: 2 },
  ]);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([
        ...tags,
        { id: Date.now().toString(), name: newTag.trim(), count: 0 },
      ]);
      setNewTag('');
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditValue(tag.name);
  };

  const handleSaveEdit = (tagId: string) => {
    if (editValue.trim()) {
      setTags(tags.map(tag => 
        tag.id === tagId ? { ...tag, name: editValue.trim() } : tag
      ));
      setEditingTag(null);
    }
  };

  const handleDeleteTag = (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      setTags(tags.filter(tag => tag.id !== tagId));
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTags((items) => arrayMove(items, items.findIndex(item => item.id === active.id), items.findIndex(item => item.id === over.id)));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Tags</h2>
      
      {/* Add new tag */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter new tag"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
        />
        <button
          onClick={handleAddTag}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </button>
      </div>

      {/* Tags list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tags.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tags.map(tag => (
              <SortableTag
                key={tag.id}
                tag={tag}
                onEdit={() => handleEditTag(tag)}
                onDelete={() => handleDeleteTag(tag.id)}
                isEditing={editingTag === tag.id}
                editValue={editValue}
                onEditChange={setEditValue}
                onSave={() => handleSaveEdit(tag.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}