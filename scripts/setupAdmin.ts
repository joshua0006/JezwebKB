import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {/* your config */};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setInitialAdmin(email: string) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    await updateDoc(userDoc.ref, { role: 'admin' });
    console.log(`${email} promoted to admin successfully`);
  } else {
    console.error('User not found');
  }
}

// Run with: ts-node scripts/setupAdmin.ts
setInitialAdmin('admin@example.com'); 