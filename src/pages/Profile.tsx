import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { userService } from '../services/userService';
import { User, Upload, X } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { uploadImage } from '../services/storageService';

export function Profile() {
  const { user, userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(userProfile?.username || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(userProfile?.photoURL || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      if (!photoFile) { // Only update if no local changes pending
        setPreviewUrl(userProfile.photoURL || null);
      }
    }
  }, [userProfile, photoFile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let photoURL = userProfile?.photoURL;
      let photoUpdated = false;

      // Handle photo upload/deletion
      if (photoFile) {
        try {
          // Generate a unique file path that includes timestamp to avoid conflicts
          const timestamp = new Date().getTime();
          const photoPath = `profilePhotos/${user.uid}_${timestamp}`;
          
          // Use the storageService for upload with progress tracking
          photoURL = await uploadImage(photoFile, photoPath, (progress) => {
            // You can add a progress indicator here if needed
            console.log(`Upload progress: ${progress}%`);
          });
          
          photoUpdated = true;
          
          // Delete old photo if exists and isn't a Google photo
          if (userProfile?.photoURL && 
              userProfile.photoURL.includes('firebasestorage') && 
              !userProfile.photoURL.includes('googleusercontent')) {
            try {
              // Extract the path from the URL - we need to handle this carefully
              // Firebase storage URLs contain a token, so we can't simply delete by URL
              const oldPhotoRef = ref(storage, userProfile.photoURL);
              await deleteObject(oldPhotoRef).catch(err => {
                console.log("Failed to delete old photo, but continuing", err);
                // Non-blocking, continue even if this fails
              });
            } catch (error) {
              console.error('Error deleting old photo:', error);
              // Non-blocking error - continue with profile update
            }
          }
        } catch (uploadError) {
          console.error('Error uploading profile photo:', uploadError);
          setError('Failed to upload profile photo. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else if (previewUrl === null && photoURL) {
        // User wants to remove photo, but only if it's not a Google photo
        if (photoURL.includes('firebasestorage') && 
            !photoURL.includes('googleusercontent')) {
          try {
            // For Google photos, we just remove the reference, no need to delete the actual file
            const photoRef = ref(storage, photoURL);
            await deleteObject(photoRef).catch(err => {
              console.log("Failed to delete photo, but continuing", err);
            });
          } catch (error) {
            console.error('Error deleting photo, continuing anyway:', error);
          }
        }
        
        // Regardless of whether delete succeeds, remove the URL from the profile
        photoURL = null;
        photoUpdated = true;
      }

      // Update profile in Firestore
      const updates: any = { username: username.trim() };
      if (photoUpdated) {
        updates.photoURL = photoURL;
      }
      
      // Update local state immediately before Firebase update
      updateProfile(updates);
      
      // Then update in Firestore
      await userService.updateUserProfile(user.uid, updates);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to determine if the current photo is from Google
  const isGooglePhoto = () => {
    return userProfile?.photoURL?.includes('googleusercontent.com') || false;
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Profile Settings
        </h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}
        
        {isGooglePhoto() && previewUrl === userProfile?.photoURL && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-700 text-sm">
              You're using your Google profile photo. You can upload a custom photo instead, or continue using your Google photo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Photo Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg transform group-hover:scale-105 transition-transform"
                      crossOrigin="anonymous"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="w-full flex items-center justify-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <Upload className="h-5 w-5 mr-2 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-600">
                    {photoFile ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Username Section */}
          <div className="space-y-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 transition-all"
                placeholder="Enter your username"
                required
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Spinner className="w-5 h-5 mr-2" />
                Updating Profile...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 