import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const commentService = {
  // Subscribe to comments
  subscribeToComments(tutorialId: string, callback: (comments: any[]) => void) {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef, 
      where('tutorialId', '==', tutorialId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(comments);
    });
  },

  async addComment(tutorialId: string, userId: string, userName: string, content: string, photoURL: string | null) {
    const commentsRef = collection(db, 'comments');
    await addDoc(commentsRef, {
      tutorialId,
      userId,
      userName,
      content,
      photoURL,
      createdAt: serverTimestamp()
    });
  },

  async getComments(tutorialId: string) {
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('tutorialId', '==', tutorialId));
    const querySnapshot = await getDocs(q);
    const comments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return comments;
  },

  async editComment(commentId: string, content: string) {
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp()
    });
  },

  async deleteComment(commentId: string) {
    const commentRef = doc(db, 'comments', commentId);
    await deleteDoc(commentRef);
  }
}; 