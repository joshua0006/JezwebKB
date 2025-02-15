import { useEffect, useState } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/user';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';
import { Input } from './ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShieldCheck, Shield, User, Bell } from 'lucide-react';
import { sendEmailNotification } from '../services/notificationService';
import { ConfirmationModal } from './ConfirmationModal';

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="mt-4">
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Spinner className="w-8 h-8 text-indigo-600 mx-auto" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.uid}>
                <TableCell className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <span>{user.username}</span>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {user.role === 'admin' ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.role === 'user' ? (
                      <Button
                        size="sm"
                        onClick={() => handleRoleUpdate(user.uid, 'admin')}
                        disabled={user.uid === userProfile?.uid}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Make Admin
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRoleUpdate(user.uid, 'user')}
                        disabled={user.uid === userProfile?.uid}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Demote to User
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowNotificationModal(true);
                      }}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notify
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onConfirm={handleSendNotification}
        title="Send Notification"
        message={
          <div className="space-y-4">
            <p>Send message to {selectedUser?.email}:</p>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
              placeholder="Enter your notification message..."
            />
          </div>
        }
      />
    </div>
  );
} 