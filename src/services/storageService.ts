import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Check if the current user has admin privileges
async function checkAdminStatus(): Promise<boolean> {
  if (!auth.currentUser) return false;
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Generic upload function for both images and videos
async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storage = getStorage();
  const storageRef = ref(storage, path);
  
  // Create upload task
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  // Return a promise that resolves with the download URL
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate and report progress
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        // Handle errors
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        // Handle successful upload
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

// Upload an image file
export async function uploadImage(
  file: File, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Ensure user is authenticated
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload images');
  }
  
  return uploadFile(file, path, onProgress);
}

// Upload a video file
export async function uploadVideo(
  file: File, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Ensure user is authenticated
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload videos');
  }
  
  // Check if user is an admin (videos might be restricted to admins)
  const isAdmin = await checkAdminStatus();
  if (!isAdmin) {
    throw new Error('Only admin users can upload videos');
  }
  
  return uploadFile(file, path, onProgress);
} 