import { adminService } from '../services/adminService';

export function UserActions({ user, onUpdate }: { user: UserProfile, onUpdate: () => void }) {
  const handlePromote = async () => {
    if (window.confirm(`Make ${user.email} an admin?`)) {
      try {
        await adminService.promoteToAdmin(user.uid);
        onUpdate();
      } catch (error) {
        console.error('Promotion failed:', error);
        alert('Promotion failed. Check console for details.');
      }
    }
  };

  return (
    <div className="flex space-x-2">
      {user.role !== 'admin' && (
        <button
          onClick={handlePromote}
          className="px-2 py-1 text-sm bg-indigo-100 text-indigo-800 rounded-md hover:bg-indigo-200 transition-colors"
        >
          Make Admin
        </button>
      )}
    </div>
  );
} 