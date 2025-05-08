import { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ConfirmationModal } from './ConfirmationModal';
import { ShieldCheck, Shield, User, Bell } from 'lucide-react';
import { sendEmailNotification } from '../services/notificationService';

export function UserManagement() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.role === 'admin') {
      fetchUsers();
    }
  }, [userProfile]);

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUser) return;
    
    try {
      await sendEmailNotification({
        to: selectedUser.email,
        subject: 'Admin Notification',
        message: notificationMessage
      });
      setNotificationMessage('');
      setSelectedUser(null);
      setShowNotificationModal(false);
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal message content
  const notificationModalContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">Send message to {selectedUser?.email}:</p>
      <textarea
        value={notificationMessage}
        onChange={(e) => setNotificationMessage(e.target.value)}
        className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        rows={4}
        placeholder="Enter your notification message..."
      />
    </div>
  );

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <div className="mb-6">
        <Input
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner className="w-8 h-8 text-indigo-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No users found matching your search criteria.
        </div>
      ) : (
        <div className="w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 w-1/5">User</th>
                <th className="text-left py-3 w-1/5">Email</th>
                <th className="text-left py-3 w-1/5">Role</th>
                <th className="text-left py-3 w-1/5">Joined</th>
                <th className="text-left py-3 w-1/5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.uid} className="border-b">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-4">{user.email}</td>
                  <td className="py-4">
                    <div className="flex items-center">
                      {user.role === 'admin' ? (
                        <div className="flex items-center text-indigo-600">
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          <span>admin</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span>user</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <div className="flex flex-col gap-2">
                      {user.role === 'admin' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRoleUpdate(user.uid, 'user')}
                          disabled={user.uid === userProfile?.uid}
                          className="flex items-center justify-center w-full"
                        >
                          <User className="h-4 w-4 mr-1.5" />
                          Demote
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRoleUpdate(user.uid, 'admin')}
                          disabled={user.uid === userProfile?.uid}
                          className="flex items-center justify-center w-full bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <Shield className="h-4 w-4 mr-1.5" />
                          Make Admin
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowNotificationModal(true);
                        }}
                        className="flex items-center justify-center w-full"
                      >
                        <Bell className="h-4 w-4 mr-1.5" />
                        Notify
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          setNotificationMessage('');
        }}
        onConfirm={handleSendNotification}
        title="Send Notification"
        message={`Send a notification to ${selectedUser?.email}`}
      />

      {/* Render the actual modal content separately since ConfirmationModal expects a string message */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => {
                setShowNotificationModal(false);
                setNotificationMessage('');
              }}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Send Notification
                      </h3>
                      <button
                        onClick={() => {
                          setShowNotificationModal(false);
                          setNotificationMessage('');
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2">
                      {notificationModalContent}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSendNotification}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={!notificationMessage.trim()}
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationMessage('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 