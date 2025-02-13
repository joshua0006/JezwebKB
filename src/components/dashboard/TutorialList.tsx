import React, { useState } from 'react';
import { Edit2, Trash2, Plus, Filter, Crown, GripVertical } from 'lucide-react';
import { tutorials, getSortedTutorials } from '../../data/tutorials';
import { TutorialForm } from './TutorialForm';
import { Article, Category, User } from '../../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableRowProps {
  tutorial: Article;
  onEdit: (tutorial: Article) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ tutorial, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tutorial.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'opacity-50 bg-gray-50' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab hover:text-indigo-600"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <img
            src={tutorial.image}
            alt={tutorial.title}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {tutorial.title}
            </div>
            <div className="text-sm text-gray-500">
              {tutorial.description.substring(0, 50)}...
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
          {tutorial.category}
          {tutorial.vipOnly && (
            <span className="ml-2 text-purple-600">
              <Crown className="h-3 w-3 inline" />
            </span>
          )}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(tutorial.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(tutorial)}
          className="text-indigo-600 hover:text-indigo-900 mr-4"
        >
          <Edit2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(tutorial.id)}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

export function TutorialList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [orderedTutorials, setOrderedTutorials] = useState(getSortedTutorials());
  const [vipUsers] = useState<User[]>([
    {
      id: 'vip-1',
      email: 'vip@example.com',
      name: 'VIP User',
      role: 'vip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'vip-2',
      email: 'vip2@example.com',
      name: 'VIP User 2',
      role: 'vip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);

  const categories: Category[] = ['wordpress', 'elementor', 'gravity-forms', 'shopify', 'general'];

  const filteredTutorials = orderedTutorials.filter(tutorial => 
    selectedCategory === 'all' ? true : tutorial.category === selectedCategory
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setOrderedTutorials((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update priorities based on new order
        return newItems.map((item, index) => ({
          ...item,
          priority: index + 1
        }));
      });
      // TODO: Save the new order to the backend
      console.log('Order updated, save to backend');
    }
  };

  const handleEdit = (article: Article) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingTutorial(article);
    setIsFormOpen(true);
  };

  React.useEffect(() => {
    if (isFormOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isFormOpen]);

  const handleDelete = (articleId: string) => {
    if (window.confirm('Are you sure you want to delete this tutorial?')) {
      // TODO: Implement delete functionality
      console.log('Delete article:', articleId);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingTutorial) {
      // TODO: Implement update functionality
      console.log('Update article:', data);
    } else {
      // TODO: Implement create functionality
      console.log('Create article:', data);
    }
    setIsFormOpen(false);
    setEditingTutorial(null);
  };

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingTutorial ? 'Edit Tutorial' : 'New Tutorial'}
          </h1>
          <button
            onClick={() => {
              setIsFormOpen(false);
              setEditingTutorial(null);
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
        <TutorialForm
          onSubmit={handleFormSubmit}
          initialData={editingTutorial}
          vipUsers={vipUsers}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Manage Tutorials</h1>
          <p className="text-sm text-gray-500 mt-1">Drag and drop tutorials to reorder them</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Tutorial
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTutorials.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTutorials.map((tutorial) => (
                  <SortableRow
                    key={tutorial.id}
                    tutorial={tutorial}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
                {filteredTutorials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No tutorials found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}