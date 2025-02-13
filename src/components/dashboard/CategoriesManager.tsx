import React, { useState } from 'react';
import { Plus, X, Save, Edit2, Layout, Box, FileText, ShoppingBag } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category } from '../../types';

interface CategoryItem {
  id: Category;
  name: string;
  icon: any;
  count: number;
}

const defaultCategories: CategoryItem[] = [
  { id: 'wordpress', name: 'WordPress', icon: Layout, count: 5 },
  { id: 'elementor', name: 'Elementor', icon: Box, count: 3 },
  { id: 'gravity-forms', name: 'Gravity Forms', icon: FileText, count: 2 },
  { id: 'shopify', name: 'Shopify', icon: ShoppingBag, count: 1 },
];

function SortableCategory({ category, onEdit, onDelete, isEditing, editValue, onEditChange, onSave }: {
  category: CategoryItem;
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
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = category.icon;

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
        <div className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 hover:bg-gray-100 rounded"
          >
            ⋮⋮
          </div>
          <div className="p-2 bg-indigo-100 rounded-md">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="text-gray-900">{category.name}</span>
          <span className="text-sm text-gray-500">
            ({category.count} articles)
          </span>
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

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const categoryId = newCategory.toLowerCase().replace(/\s+/g, '-');
      setCategories([
        ...categories,
        {
          id: categoryId as Category,
          name: newCategory.trim(),
          icon: Layout,
          count: 0,
        },
      ]);
      setNewCategory('');
    }
  };

  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategory(category.id);
    setEditValue(category.name);
  };

  const handleSaveEdit = (categoryId: string) => {
    if (editValue.trim()) {
      setCategories(categories.map(category => 
        category.id === categoryId
          ? { ...category, name: editValue.trim() }
          : category
      ));
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(category => category.id !== categoryId));
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCategories((items) => arrayMove(items, items.findIndex(item => item.id === active.id), items.findIndex(item => item.id === over.id)));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Categories</h2>
      
      {/* Add new category */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Enter new category"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
        />
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {categories.map(category => (
              <SortableCategory
                key={category.id}
                category={category}
                onEdit={() => handleEditCategory(category)}
                onDelete={() => handleDeleteCategory(category.id)}
                isEditing={editingCategory === category.id}
                editValue={editValue}
                onEditChange={setEditValue}
                onSave={() => handleSaveEdit(category.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}