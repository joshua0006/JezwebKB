import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDJRFjNFtjdH8NuucKeNSpzfF5b40DQRFQ",
  authDomain: "jezweb-kb.firebaseapp.com",
  projectId: "jezweb-kb",
  storageBucket: "jezweb-kb.firebasestorage.app",
  messagingSenderId: "851109416291",
  appId: "1:851109416291:web:462ad083f4fa5b74f55756"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

export default app; 