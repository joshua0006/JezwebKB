import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Uploads an image file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path where the file should be saved
 * @param onProgress Optional callback for tracking upload progress (0-100)
 * @returns Promise resolving to the download URL of the uploaded file
 */
export const uploadImage = async (
  file: File, 
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle errors during upload
          console.error('Upload failed:', error);
          reject(new Error('Failed to upload image. Please try again.'));
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(new Error('Upload completed but failed to get download URL.'));
          }
        }
      );
    } catch (error) {
      console.error('Error initiating upload:', error);
      reject(error);
    }
  });
}; 