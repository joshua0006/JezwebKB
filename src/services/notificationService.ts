import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface EmailNotification {
  to: string;
  subject: string;
  message: string;
}

export const sendEmailNotification = async (notification: EmailNotification) => {
  const functionRef = httpsCallable(functions, 'sendEmailNotification');
  return functionRef(notification);
};

export async function sendInAppNotification(userId: string, message: string) {
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    userId,
    message,
    read: false,
    createdAt: serverTimestamp()
  });
} 