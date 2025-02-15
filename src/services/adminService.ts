import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const adminService = {
  async promoteToAdmin(targetUserId: string, currentUserId: string) {
    // Verify current user is admin
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (currentUserDoc.data()?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can promote users');
    }

    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      role: 'admin'
    });
  },

  async demoteAdmin(targetUserId: string, currentUserId: string) {
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (currentUserDoc.data()?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can demote users');
    }

    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      role: 'user'
    });
  }
}; 