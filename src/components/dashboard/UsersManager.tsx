import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Shield, Book } from 'lucide-react';
import { User } from '../../types';
import { TutorialAssignment } from './TutorialAssignment';

const DEMO_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-03-15T00:00:00.000Z',
    updatedAt: '2024-03-15T00:00:00.000Z',
  },
  {
    id: 'vip-1',
    email: 'vip@example.com',
    name: 'VIP User',
    role: 'vip',
    assignedTutorials: ['elementor-advanced-techniques'],
    createdAt: '2024-03-15T00:00:00.000Z',
    updatedAt: '2024-03-15T00:00:00.000Z',
  },
  {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    createdAt: '2024-03-15T00:00:00.000Z',
    updatedAt: '2024-03-15T00:00:00.000Z',
  },
];

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'vip' | 'user';
}

export function UsersManager() {
  const [users] = useState<User[]>(DEMO_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [assigningTutorials, setAssigningTutorials] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'user',
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // TODO: Implement delete functionality with Firebase
      console.log('Delete user:', userId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create/update functionality with Firebase
    console.log('Submit user:', editingUser ? 'update' : 'create', formData);
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'user' });
    setAssigningTutorials(null);
  };

  const handleAssignTutorials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setAssigningTutorials(user);
    }
  };

  const handleUpdateAssignedTutorials = (tutorialIds: string[]) => {
    if (assigningTutorials) {
      // TODO: Update user's assigned tutorials in Firebase
      console.log('Update assigned tutorials for user:', assigningTutorials.id, tutorialIds);
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isFormOpen) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={() => {
              setIsFormOpen(false);
              setEditingUser(null);
              setFormData({ name: '', email: '', role: 'user' });
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="user">Regular User</option>
              <option value="vip">VIP User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingUser(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {editingUser ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (assigningTutorials) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Assign Tutorials to {assigningTutorials.name}
            </h2>
            <p className="text-sm text-gray-500">Select tutorials to give this VIP user access to</p>
          </div>
          <button
            onClick={() => setAssigningTutorials(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        <TutorialAssignment
          assignedTutorials={assigningTutorials.assignedTutorials}
          onAssign={handleUpdateAssignedTutorials}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Manage Users</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title="Edit user"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  {user.role === 'vip' && (
                    <button
                      onClick={() => handleAssignTutorials(user.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      title="Assign tutorials"
                    >
                      <Book className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete user"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}