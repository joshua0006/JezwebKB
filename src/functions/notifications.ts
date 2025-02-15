import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

export const sendBulkNotifications = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can send notifications'
    );
  }

  const { title, message, recipientIds } = data;
  const batch = db.batch();
  
  recipientIds.forEach((userId: string) => {
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, {
      title,
      message,
      userId,
      read: false,
      createdAt: new Date(),
      sender: context.auth?.uid
    });
  });

  try {
    await batch.commit();
    return { success: true, count: recipientIds.length };
  } catch (error) {
    logger.error('Error sending bulk notifications:', error);
    throw new functions.https.HttpsError('internal', 'Notification failed');
  }
}); 