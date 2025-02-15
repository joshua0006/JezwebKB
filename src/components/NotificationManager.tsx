import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';
import { ConfirmationModal } from './ConfirmationModal';

export function NotificationManager() {
  const { userProfile } = useAuth();
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    recipients: 'all'
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setNotifications(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    
    if (userProfile?.role === 'admin') {
      fetchNotifications();
    }
  }, [userProfile]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        title: notification.title,
        message: notification.message,
        createdAt: serverTimestamp()
      });
      console.log('Document written with ID: ', docRef.id);
    } catch (error) {
      console.error('Full error details:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}\nCheck browser console for details`);
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">User Notifications</h3>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold mb-4">Send New Notification</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification({...notification, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="New Tutorial Available"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={notification.message}
                onChange={(e) => setNotification({...notification, message: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 h-32"
                placeholder="We've added a new tutorial about..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
              <select
                value={notification.recipients}
                onChange={(e) => setNotification({...notification, recipients: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
              </select>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={!notification.title || !notification.message}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Spinner className="w-5 h-5 mx-auto" /> : 'Send Notification'}
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Notification History</h4>
          <div className="space-y-4">
            {notifications.map(notification => (
              <div key={notification.id} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">{notification.title}</h5>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.createdAt?.toDate()).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{notification.message}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Sent to: {notification.recipients === 'all' ? 'All Users' : notification.recipients}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSend}
        title="Confirm Notification"
        message="Are you sure you want to send this notification to all users?"
      />
    </div>
  );
} 