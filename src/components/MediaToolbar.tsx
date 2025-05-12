import React, { useState, useRef } from 'react';
import { Image, Film, X, Upload, ChevronsLeft, ChevronsRight, ChevronsUp, ChevronsDown, AlignLeft, AlignCenter, AlignRight, AlertTriangle } from 'lucide-react';
import { Spinner } from './Spinner';
import { uploadImage, uploadVideo } from '../services/storageService';

interface MediaToolbarProps {
  onInsertImage: (url: string, caption: string, size: string, alignment: string) => void;
  onInsertVideo: (url: string, caption: string, size: string, alignment: string) => void;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({ onInsertImage, onInsertVideo }) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [size, setSize] = useState('medium'); // small, medium, large
  const [alignment, setAlignment] = useState('center'); // left, center, right
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const openMediaModal = (type: 'image' | 'video') => {
    setMediaType(type);
    setMediaUrl('');
    setCaption('');
    setSize('medium');
    setAlignment('center');
    setError(null);
    setUploadSuccess(false);
    setShowMediaModal(true);
  };
  
  const displayError = (message: string) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, 5000); // Auto-clear error after 5 seconds
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setError(null);
    setUploadSuccess(false);
    
    // Validate file type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      displayError('Please select a valid image file (jpg, png, gif, etc)');
      return;
    }
    
    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      displayError('Please select a valid video file (mp4, webm, etc)');
      return;
    }
    
    // Validate file size (limit to 5MB for images, 50MB for videos)
    const maxSize = mediaType === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      displayError(`File size exceeds the limit (${mediaType === 'image' ? '5MB' : '50MB'})`);
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Upload file to Firebase Storage
      const uploadMethod = mediaType === 'image' ? uploadImage : uploadVideo;
      const path = `articles/${mediaType}s/${new Date().getTime()}_${file.name}`;
      
      const url = await uploadMethod(
        file,
        path,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Set the uploaded URL
      setMediaUrl(url);
      setUploadSuccess(true);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      console.error(`Error uploading ${mediaType}:`, error);
      
      // Provide specific error messages based on the error
      if (error.message && error.message.includes('admin users')) {
        displayError('Only admin users can upload videos');
      } else if (error.message && error.message.includes('authenticated')) {
        displayError('You must be logged in to upload media');
      } else if (error.code === 'storage/unauthorized') {
        displayError('You do not have permission to upload this file');
      } else if (error.code === 'storage/canceled') {
        displayError('Upload was canceled');
      } else if (error.code === 'storage/unknown') {
        displayError('An unknown error occurred during upload');
      } else {
        displayError(`Error uploading ${mediaType}. Please try again later.`);
      }
    } finally {
      setUploading(false);
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaUrl(e.target.value);
    setError(null);
    setUploadSuccess(false);
  };
  
  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    
    try {
      // Check if it's a valid URL
      new URL(url);
      return true;
    } catch (e) {
      // If it looks like a domain without protocol, add https:// and try again
      if (url.includes('.') && !url.match(/^[a-z]+:\/\//i)) {
        try {
          new URL(`https://${url}`);
          setMediaUrl(`https://${url}`);
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }
  };
  
  const handleInsert = () => {
    if (!mediaUrl) {
      displayError('Please upload or enter a valid URL');
      return;
    }
    
    // Validate URL if manually entered
    if (!uploadSuccess && !validateUrl(mediaUrl)) {
      displayError('Please enter a valid URL');
      return;
    }
    
    if (mediaType === 'image') {
      onInsertImage(mediaUrl, caption, size, alignment);
    } else {
      onInsertVideo(mediaUrl, caption, size, alignment);
    }
    
    setShowMediaModal(false);
  };
  
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => openMediaModal('image')}
          className="p-2 rounded hover:bg-gray-200 flex items-center gap-1"
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
          <span className="text-xs">Image</span>
        </button>
        
        <button
          type="button"
          onClick={() => openMediaModal('video')}
          className="p-2 rounded hover:bg-gray-200 flex items-center gap-1"
          title="Insert Video"
        >
          <Film className="w-4 h-4" />
          <span className="text-xs">Video</span>
        </button>
      </div>
      
      {/* Media Insert Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Insert {mediaType === 'image' ? 'Image' : 'Video'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowMediaModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {/* Success message */}
            {uploadSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                <p className="text-sm">Upload successful! You can now insert your {mediaType}.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload {mediaType === 'image' ? 'Image' : 'Video'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={triggerFileUpload}
                    disabled={uploading}
                    className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 rounded-lg ${
                      uploading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Spinner className="w-4 h-4 text-gray-400" />
                        {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {mediaType === 'image' ? 'Choose Image' : 'Choose Video'}
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {mediaType === 'image' ? 'Max size: 5MB' : 'Max size: 50MB'}
                </p>
              </div>
              
              {/* URL Input */}
              <div>
                <label htmlFor="media-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Or enter URL
                </label>
                <input
                  type="text"
                  id="media-url"
                  value={mediaUrl}
                  onChange={handleUrlChange}
                  placeholder={`Enter ${mediaType} URL`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* Caption */}
              <div>
                <label htmlFor="media-caption" className="block text-sm font-medium text-gray-700 mb-1">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  id="media-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter caption for this media"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* Size Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSize('small')}
                    className={`flex-1 px-3 py-1 border rounded-lg flex items-center justify-center gap-1 ${
                      size === 'small' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                    Small
                  </button>
                  <button
                    type="button"
                    onClick={() => setSize('medium')}
                    className={`flex-1 px-3 py-1 border rounded-lg flex items-center justify-center gap-1 ${
                      size === 'medium' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    <ChevronsRight className="w-4 h-4" />
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setSize('large')}
                    className={`flex-1 px-3 py-1 border rounded-lg flex items-center justify-center gap-1 ${
                      size === 'large' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    <ChevronsUp className="w-4 h-4" />
                    Large
                  </button>
                </div>
              </div>
              
              {/* Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAlignment('left')}
                    className={`flex-1 px-3 py-1 border rounded-lg flex items-center justify-center gap-1 ${
                      alignment === 'left' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('center')}
                    className={`flex-1 px-3 py-1 border rounded-lg flex items-center justify-center gap-1 ${
                      alignment === 'center' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('right')}
                    className={`flex-1 px-3 py-1 border rounded-lg flex items-center justify-center gap-1 ${
                      alignment === 'right' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-gray-300'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                    Right
                  </button>
                </div>
              </div>
              
              {/* Preview if URL exists */}
              {mediaUrl && (
                <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-1">Preview</p>
                  {mediaType === 'image' ? (
                    <div className="flex justify-center">
                      <img 
                        src={mediaUrl} 
                        alt={caption || 'Preview'} 
                        className="max-h-32 max-w-full object-contain rounded"
                        onError={() => displayError('Unable to load image preview. Please check the URL.')}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <video 
                        src={mediaUrl} 
                        controls 
                        className="max-h-32 max-w-full rounded"
                        onError={() => displayError('Unable to load video preview. Please check the URL.')}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsert}
                  disabled={!mediaUrl || uploading}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg ${
                    !mediaUrl || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 