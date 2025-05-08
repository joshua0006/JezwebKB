import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const adminService = {
  async promoteToAdmin(targetUserId: string, currentUserId: string) {
    // No role verification needed - any authenticated user can promote users
    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      role: 'admin'
    });
  },

  async demoteAdmin(targetUserId: string, currentUserId: string) {
    // No role verification needed - any authenticated user can demote users
    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      role: 'user'
    });
  }
}; 