import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Edit2, Layout, Box, FileText, ShoppingBag, ArrowRight, ChevronDown,
  Globe, Settings, File, ShoppingCart, Tag,
  BookOpen, Code, Coffee, Database, FileQuestion, Heart, Home, Image, Mail, MessageSquare, Music, 
  Package, Star, User, Video, Zap } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category } from '../../types';
import { getAllCategories, addCategory, deleteCategory } from '../../services/articleService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface CategoryItem {
  id: Category;
  name: string;
  icon: string;
  count: number;
  docId: string;
}

// Map of available icons for categories
const availableIcons: Record<string, any> = {
  // Default icons
  'tag': Tag,
  'globe': Globe,
  'settings': Settings,
  'file': File,
  'cart': ShoppingCart,
  'book': BookOpen,
  'code': Code,
  'coffee': Coffee,
  'database': Database,
  'fileQuestion': FileQuestion,
  'heart': Heart,
  'home': Home,
  'image': Image,
  'mail': Mail,
  'message': MessageSquare,
  'music': Music,
  'package': Package,
  'star': Star,
  'user': User,
  'video': Video,
  'zap': Zap,
  // Legacy mappings
  'wordpress': Layout,
  'elementor': Box,
  'gravity-forms': FileText,
  'shopify': ShoppingBag,
  'general': ArrowRight,
};

// Function to get the icon component based on the icon name
const getIconComponent = (iconName: string) => {
  return availableIcons[iconName] || Tag; // Fallback to Tag icon
};

function SortableCategory({ category, onEdit, onDelete, isEditing, editValue, onEditChange, onSave, onChangeIcon }: {
  category: CategoryItem;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onChangeIcon: (categoryId: string) => void;
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

  const IconComponent = getIconComponent(category.icon);

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
          <div 
            className="p-2 bg-indigo-100 rounded-md cursor-pointer hover:bg-indigo-200"
            onClick={() => onChangeIcon(category.id)}
            title="Click to change icon"
          >
            <IconComponent className="h-5 w-5 text-indigo-600" />
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
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Icon selection
  const [selectedIcon, setSelectedIcon] = useState<string>('tag');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [iconSelectorForCategory, setIconSelectorForCategory] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const fetchedCategories = await getAllCategories();
        
        // Get article counts for each category
        const categoriesWithCounts = await Promise.all(
          fetchedCategories.map(async (category) => {
            const articlesRef = collection(db, 'articles');
            const q = query(
              articlesRef, 
              where('category', '==', category.id),
              where('published', '==', true)
            );
            const querySnapshot = await getDocs(q);
            
            return {
              id: category.id,
              name: category.name,
              icon: category.icon || 'tag',
              count: querySnapshot.size,
              docId: category.docId
            };
          })
        );
        
        setCategories(categoriesWithCounts);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        const result = await addCategory(newCategory.trim(), selectedIcon);
        
        // Add the new category to the list with 0 count
        setCategories([
          ...categories,
          {
            id: result.id,
            name: result.name,
            icon: result.icon,
            count: 0,
            docId: 'temp-' + Date.now() // This will be replaced on next fetch
          },
        ]);
        
        setNewCategory('');
        setSelectedIcon('tag');
      } catch (err) {
        console.error('Error adding category:', err);
        setError('Failed to add category. Please try again.');
      }
    }
  };

  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategory(category.id);
    setEditValue(category.name);
  };

  const handleSaveEdit = (categoryId: string) => {
    if (editValue.trim()) {
      // In a real app, you would update the category in Firebase here
      setCategories(categories.map(category => 
        category.id === categoryId
          ? { ...category, name: editValue.trim() }
          : category
      ));
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const categoryToDelete = categories.find(c => c.id === categoryId);
      if (!categoryToDelete) return;
      
      try {
        await deleteCategory(categoryToDelete.docId);
        setCategories(categories.filter(category => category.id !== categoryId));
      } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category. Please try again.');
      }
    }
  };

  const handleChangeIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setSelectedIcon(category.icon);
      setIconSelectorForCategory(categoryId);
      setShowIconSelector(true);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    
    if (iconSelectorForCategory) {
      // Update the icon for the category
      setCategories(categories.map(category => 
        category.id === iconSelectorForCategory
          ? { ...category, icon: iconName }
          : category
      ));
      
      // In a real app, you would update the category in Firebase here
      
      setIconSelectorForCategory(null);
    }
    
    setShowIconSelector(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCategories((items) => arrayMove(items, items.findIndex(item => item.id === active.id), items.findIndex(item => item.id === over.id)));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Categories</h2>
        <div className="text-center py-8">
          <div className="animate-pulse h-6 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="animate-pulse h-10 w-full bg-gray-200 rounded mb-2"></div>
          <div className="animate-pulse h-10 w-full bg-gray-200 rounded mb-2"></div>
          <div className="animate-pulse h-10 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Categories</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Add new category */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
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
            disabled={!newCategory.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
        
        {/* Icon selection dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Icon
          </label>
          <button
            type="button"
            onClick={() => {
              setIconSelectorForCategory(null);
              setShowIconSelector(!showIconSelector);
            }}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <div className="flex items-center gap-2">
              {React.createElement(getIconComponent(selectedIcon), { className: "w-4 h-4" })}
              <span className="text-sm">{selectedIcon}</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showIconSelector && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2 p-2">
                {Object.keys(availableIcons).map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-100 ${
                      selectedIcon === iconName ? 'bg-indigo-50 border border-indigo-200' : ''
                    }`}
                  >
                    {React.createElement(getIconComponent(iconName), { className: "w-4 h-4" })}
                    <span className="text-xs mt-1">{iconName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
                onChangeIcon={handleChangeIcon}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}