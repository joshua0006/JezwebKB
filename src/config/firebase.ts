import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBNZClqxXyCxLT6CU-xJeY9RdCqnElaMPE",
  authDomain: "jezwebkb.firebaseapp.com",
  projectId: "jezwebkb",
  storageBucket: "jezwebkb.firebasestorage.app",
  messagingSenderId: "724024499804",
  appId: "1:724024499804:web:b2fcbe56c5896867879099",
  measurementId: "G-1Y53V5J3YH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app; 