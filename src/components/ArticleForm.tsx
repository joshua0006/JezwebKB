import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArticleFormData } from '../types/article';
import { Category } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { createArticle, getArticleById, updateArticle } from '../services/articleService';
import { Spinner } from './Spinner';
import { X, Plus, Save, ArrowLeft, Bold, Italic, Underline, ListOrdered, List, Link as LinkIcon, Type, ExternalLink, AlertTriangle, Upload, Image, Calendar, User, Film, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { uploadImage, uploadVideo } from '../services/storageService';
import DirectQuill, { DirectQuillHandle } from './DirectQuill';
import 'quill/dist/quill.snow.css';
import { registerCustomBlots, toolbarOptions, insertImage, insertVideo, initializeStyles } from './QuillConfig';

// Custom preview styles
const previewStyles = `
  .article-preview {
    background-color: white;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    color: #333;
  }

  .article-preview img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .article-preview h1, 
  .article-preview h2, 
  .article-preview h3, 
  .article-preview h4,
  .article-preview h5,
  .article-preview h6 {
    font-weight: 700;
    color: #111;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  .article-preview h1 {
    font-size: 2.5rem;
    line-height: 1.2;
  }

  .article-preview h2 {
    font-size: 2rem;
    line-height: 1.25;
  }

  .article-preview h3 {
    font-size: 1.5rem;
    line-height: 1.3;
  }

  .article-preview p {
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .article-preview a {
    color: #4f46e5;
    text-decoration: none;
  }

  .article-preview a:hover {
    text-decoration: underline;
  }

  .article-preview blockquote {
    margin-left: 0;
    padding: 0.5rem 1rem;
    border-left: 4px solid #4f46e5;
    background-color: #f5f7ff;
    font-style: italic;
  }

  .article-preview pre {
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }

  .article-preview code {
    background-color: #f1f5f9;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  .article-preview ul, 
  .article-preview ol {
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
    padding-left: 1.5rem;
  }

  .article-preview li {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .article-preview hr {
    margin-top: 2rem;
    margin-bottom: 2rem;
    border: 0;
    border-top: 1px solid #e5e7eb;
  }

  .article-preview .media-caption {
    font-style: italic;
    color: #6b7280;
    text-align: center;
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .article-preview .media-container {
    margin: 2rem 0;
  }

  .article-preview .media-container.align-center {
    text-align: center;
  }

  .article-preview .media-container.align-left {
    text-align: left;
  }

  .article-preview .media-container.align-right {
    text-align: right;
  }
`;

// Using a contentEditable div for rich text editing
// This gives us real-time formatting display

const initialFormData: ArticleFormData = {
  title: '',
  content: '',
  category: 'general',
  tags: [],
  published: false,
  author: '',
  publicationDate: '',
  additionalImages: [],
  videos: [],
};

const categories: { value: Category; label: string }[] = [
  { value: 'wordpress', label: 'WordPress' },
  { value: 'elementor', label: 'Elementor' },
  { value: 'gravity-forms', label: 'Gravity Forms' },
  { value: 'shopify', label: 'Shopify' },
];

// Utility function to safely decode HTML content before inserting into editor
const decodeHtmlEntities = (html: string): string => {
  if (!html) return '';
  
  // Create a textarea element to safely decode HTML entities
  const textArea = document.createElement('textarea');
  textArea.innerHTML = html;
  const decodedContent = textArea.value;
  
  // Clean up
  textArea.remove();
  
  return decodedContent;
};

// Log content for debugging purposes
const logContentDebug = (stage: string, content: string) => {
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    const previewContent = content.length > 150 
      ? content.substring(0, 150) + '...' 
      : content;
    console.log(`[${stage}] Content (${content.length} chars):`, previewContent);
  }
};

// Add a utility to sanitize HTML content as a fallback
const sanitizeHtml = (html: string): string => {
  try {
    // This is a simple sanitizer, in a real app you'd use a library like DOMPurify
    // Strip out any potentially dangerous elements/attributes
    const clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
    return clean;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return html; // Return the original if sanitization fails
  }
};

// Helper function to ensure URLs are properly formatted
const formatUrl = (url: string): string => {
  // If URL is empty, return empty string
  if (!url) return '';
  
  // Trim the URL
  const trimmedUrl = url.trim();
  
  // Check if URL already has a protocol (http://, https://, ftp://, etc.)
  if (/^[a-z]+:\/\//i.test(trimmedUrl)) {
    return trimmedUrl; // URL already has a protocol
  }
  
  // Check if URL is a valid URL format (domain.tld)
  // This regexp checks for something like: example.com, sub.example.co.uk, etc.
  if (/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(:[0-9]{1,5})?(\/.*)?$/i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`;
  }
  
  // If it doesn't match domain pattern, it might be a relative URL or invalid
  // For safety, we'll add a protocol only if it looks like a domain without protocol
  if (trimmedUrl.includes('.') && !trimmedUrl.startsWith('/')) {
    return `https://${trimmedUrl}`;
  }
  
  // Return the original for relative URLs or invalid URLs
  return trimmedUrl;
};

export function ArticleForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [formData, setFormData] = useState<ArticleFormData>(initialFormData);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ArticleFormData, string>>>({});
  const [newTag, setNewTag] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Quill editor reference
  const quillRef = useRef<DirectQuillHandle>(null);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Media insertion modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaSize, setMediaSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [mediaAlignment, setMediaAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  // Use a state variable to track when content is ready to be rendered
  const [contentToRender, setContentToRender] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add new state variables for additional features
  const [additionalImagesUploading, setAdditionalImagesUploading] = useState<boolean[]>([]);
  const [additionalImagesProgress, setAdditionalImagesProgress] = useState<number[]>([]);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  
  const [videosUploading, setVideosUploading] = useState<boolean[]>([]);
  const [videosProgress, setVideosProgress] = useState<number[]>([]);
  const videosInputRef = useRef<HTMLInputElement>(null);
  
  // Add state for media type selection
  const [featuredMediaType, setFeaturedMediaType] = useState<'image' | 'video'>('image');
  
// Function to handle save status message display
const displayErrorMessage = (message: string) => {
  setSaveStatus('error');
  setStatusMessage(message);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Define a common media upload handler to reduce redundancy
const handleMediaUpload = async (
  files: FileList | null,
  type: 'image' | 'video',
  pathPrefix: string,
  onComplete: (url: string) => void,
  setUploadingState: (loading: boolean) => void,
  setProgressState: (progress: number) => void
) => {
  if (!files || files.length === 0) return;
  
  const file = files[0];
  
  // Validate file type
  if ((type === 'image' && !file.type.startsWith('image/')) || 
      (type === 'video' && !file.type.startsWith('video/'))) {
    displayErrorMessage(`Please select a valid ${type} file`);
    return;
  }
  
  // Validate file size (limit to 5MB for images, 50MB for videos)
  const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    displayErrorMessage(`File size should be less than ${type === 'image' ? '5MB' : '50MB'}`);
    return;
  }
  
  try {
    setUploadingState(true);
    setProgressState(0);
    
    // Upload file to Firebase Storage
    const uploadMethod = type === 'image' ? uploadImage : uploadVideo;
    const path = `${pathPrefix}/${new Date().getTime()}_${file.name}`;
    
    const url = await uploadMethod(
      file,
      path,
      (progress) => {
        setProgressState(progress);
      }
    );
    
    // Return the uploaded URL
    onComplete(url);
    
  } catch (error: any) {
    console.error(`Error uploading ${type}:`, error);
    let errorMessage = `Error uploading ${type}. Please try again.`;
    
    // Check for specific errors
    if (error.message && error.message.includes('admin users')) {
      errorMessage = 'You need admin privileges to upload videos.';
    } else if (error.message && error.message.includes('authenticated')) {
      errorMessage = 'You must be logged in to upload media.';
    }
    
    displayErrorMessage(errorMessage);
  } finally {
    setUploadingState(false);
  }
};

// Handle image file upload
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  const file = files[0];
  
  // Validate file type based on selected media type
  if (featuredMediaType === 'image' && !file.type.startsWith('image/')) {
    displayErrorMessage('Only image files are allowed');
    return;
  }
  
  if (featuredMediaType === 'video' && !file.type.startsWith('video/')) {
    displayErrorMessage('Only video files are allowed');
    return;
  }
  
  // Validate file size (limit to 5MB for images, 50MB for videos)
  const maxSize = featuredMediaType === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    displayErrorMessage(`File size should be less than ${featuredMediaType === 'image' ? '5MB' : '50MB'}`);
    return;
  }
  
  try {
    setUploading(true);
    setUploadProgress(0);
    
    // Upload file to Firebase Storage
    const uploadMethod = featuredMediaType === 'image' ? uploadImage : uploadVideo;
    const path = `articles/${featuredMediaType}s/${new Date().getTime()}_${file.name}`;
    
    const mediaUrl = await uploadMethod(
      file, 
      path,
      (progress) => {
        setUploadProgress(progress);
      }
    );
    
    // Update form data with the uploaded URL
    setFormData(prev => ({
      ...prev,
      image: mediaUrl
    }));
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
  } catch (error) {
    console.error(`Error uploading ${featuredMediaType}:`, error);
    displayErrorMessage(`Error uploading ${featuredMediaType}. Please try again.`);
  } finally {
    setUploading(false);
  }
};

  // Handle additional image upload
  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      displayErrorMessage('Only image files are allowed');
      return;
    }
    
    // Validate file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      displayErrorMessage('File size should be less than 5MB');
      return;
    }
    
    try {
      // Add a new uploading entry for tracking this upload
      const uploadIndex = additionalImagesUploading.length;
      setAdditionalImagesUploading(prev => [...prev, true]);
      setAdditionalImagesProgress(prev => [...prev, 0]);
      
      // Upload file to Firebase Storage
      const path = `articles/additional-images/${new Date().getTime()}_${file.name}`;
      
      const imageUrl = await uploadImage(
        file, 
        path,
        (progress) => {
          // Update progress for this specific upload
          setAdditionalImagesProgress(prev => {
            const updated = [...prev];
            updated[uploadIndex] = progress;
            return updated;
          });
        }
      );
      
      // Update form data with the uploaded URL
      setFormData(prev => ({
        ...prev,
        additionalImages: [...prev.additionalImages, imageUrl]
      }));
      
      // Reset file input
      if (additionalImagesInputRef.current) {
        additionalImagesInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error(`Error uploading additional image:`, error);
      displayErrorMessage('Error uploading additional image. Please try again.');
    } finally {
      // Remove the uploading entry
      setAdditionalImagesUploading(prev => prev.slice(0, -1));
      setAdditionalImagesProgress(prev => prev.slice(0, -1));
    }
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      displayErrorMessage('Only video files are allowed');
      return;
    }
    
    // Validate file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      displayErrorMessage('File size should be less than 50MB');
      return;
    }
    
    try {
      // Add a new uploading entry for tracking this upload
      const uploadIndex = videosUploading.length;
      setVideosUploading(prev => [...prev, true]);
      setVideosProgress(prev => [...prev, 0]);
      
      // Upload file to Firebase Storage
      const path = `articles/videos/${new Date().getTime()}_${file.name}`;
      
      const videoUrl = await uploadVideo(
        file, 
        path,
        (progress) => {
          // Update progress for this specific upload
          setVideosProgress(prev => {
            const updated = [...prev];
            updated[uploadIndex] = progress;
            return updated;
          });
        }
      );
      
      // Update form data with the uploaded URL
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, videoUrl]
      }));
      
      // Reset file input
      if (videosInputRef.current) {
        videosInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error(`Error uploading video:`, error);
      displayErrorMessage('Error uploading video. Please try again.');
    } finally {
      // Remove the uploading entry
      setVideosUploading(prev => prev.slice(0, -1));
      setVideosProgress(prev => prev.slice(0, -1));
    }
  };
  
  // Initialize Quill custom blots and CSS
  useEffect(() => {
    registerCustomBlots();
    initializeStyles();
    
    // Add preview styles
    const styleElement = document.createElement('style');
    styleElement.id = 'article-preview-styles';
    styleElement.textContent = previewStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      const existingStyle = document.getElementById('article-preview-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchArticle = async () => {
      if (isEditing && id) {
        try {
          setLoading(true);
          const article = await getArticleById(id);
          logContentDebug('Fetched', article.content);
          
          // Store the content in state
          setFormData({
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags || [],
            image: article.image,
            published: article.published,
            author: article.author || '',
            publicationDate: article.publicationDate || '',
            additionalImages: article.additionalImages || [],
            videos: article.videos || [],
          });
        } catch (error) {
          console.error('Error fetching article:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [id, isEditing]);
  
  // Ensure user is authenticated and check if they're an admin
  useEffect(() => {
    const checkAuthStatus = () => {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setStatusMessage('You must be logged in to create or edit articles');
        setSaveStatus('error');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
    };
    
    checkAuthStatus();
  }, [navigate]);
  
  // Check for active formats when selection changes - simplified for WYSIWYG editor
  const checkActiveFormats = () => {
    // We're now using Quill's built-in formatting, so this function can be minimal
    // This is kept as a placeholder for the onChangeSelection event
  };

  // Handle content change in Quill editor
  const handleEditorChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
    
    // Clear error when field is edited
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: undefined }));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      // Special handling for image field to avoid undefined values
      if (name === 'image') {
        return {
          ...prev,
          [name]: value.trim() || null
        };
      }
      
      return {
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : value
      };
    });
    
    // Clear error when field is edited
    if (errors[name as keyof ArticleFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ArticleFormData, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Get the latest content from the editor for validation
    let editorContent = formData.content;
    if (quillRef.current) {
      editorContent = quillRef.current.getHTML();
    }
    
    if (!editorContent.trim() || editorContent === '<p><br></p>') {
      newErrors.content = 'Content is required';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Save article function with specific publish state
  const saveArticle = async (publish: boolean) => {
    // Reset any previous error messages
    setSaveStatus('idle');
    setStatusMessage('');
    
    // Ensure user is logged in
    if (!auth.currentUser) {
      displayErrorMessage('Authentication error. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    // Get the latest content from the editor
    let editorContent = formData.content;
    if (quillRef.current) {
      // Capture the raw HTML content
      editorContent = quillRef.current.getHTML() || '<p>No content</p>';
      
      // Clean up any empty paragraphs that might have been created
      editorContent = editorContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
      
      // Log the content being saved for debugging
      logContentDebug('Saving', editorContent);
      
      // Update formData with the latest content
      setFormData(prev => ({
        ...prev,
        content: editorContent
      }));
    }
    
    if (!validateForm()) {
      return;
    }
    
    if (!userProfile?.uid) {
      displayErrorMessage('User not authenticated. Please sign in again.');
      return;
    }
    
    // Check if user is admin
    if (userProfile.role !== 'admin') {
      displayErrorMessage('Only admin users can create or edit articles');
      return;
    }
    
    try {
      setSaving(true);
      setSaveStatus('saving');
      
      // Use the latest editorContent (not formData.content) to ensure we use the most recent content
      // without having to wait for the state update
      const articleData = {
        ...formData,
        content: editorContent, // Use the cleaned HTML content directly
        published: publish,
        // Ensure all required fields are present
        title: formData.title.trim() || 'Untitled',
        category: formData.category || 'general',
        tags: formData.tags || [],
        // Convert empty image string to null instead of undefined
        image: formData.image?.trim() || null,
        // Do NOT add client-side timestamps - let Firebase handle this
      };
      
      console.log('Saving article data:', articleData);
      
      if (isEditing && id) {
        await updateArticle(id, articleData);
        setSaveStatus('success');
        setStatusMessage(`Article ${publish ? 'published' : 'saved as draft'} successfully!`);
      } else {
        const result = await createArticle(articleData, userProfile.uid);
        setSaveStatus('success');
        setStatusMessage(`Article ${publish ? 'published' : 'saved as draft'} successfully!`);
      }
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/admin/articles');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving article:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error saving article. Please try again.';
      displayErrorMessage(errorMessage);
      setSaving(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Ensure we get the latest content from the Quill editor
    if (quillRef.current) {
      const content = quillRef.current.getHTML();
      setFormData(prev => ({
        ...prev,
        content
      }));
    }
    
    await saveArticle(formData.published);
  };
  
  // Publish article
  const publishArticle = async () => {
    // Ensure we get the latest content from the Quill editor
    if (quillRef.current) {
      const content = quillRef.current.getHTML();
      setFormData(prev => ({
        ...prev,
        content
      }));
    }
    
    await saveArticle(true);
  };
  
  // Save as draft
  const saveAsDraft = async () => {
    // Ensure we get the latest content from the Quill editor
    if (quillRef.current) {
      const content = quillRef.current.getHTML();
      setFormData(prev => ({
        ...prev,
        content
      }));
    }
    
    await saveArticle(false);
  };
  
  // Insert image with caption into the editor
  const handleInsertImage = (url: string, caption: string, size: string, alignment: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      insertImage(editor, url, caption, size, alignment);
    }
  };
  
  // Insert video with caption into the editor
  const handleInsertVideo = (url: string, caption: string, size: string, alignment: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      insertVideo(editor, url, caption, size, alignment);
    }
  };
  
  // Insert media into editor
  const insertMediaToEditor = () => {
    if (!quillRef.current || !mediaUrl) return;
    
    if (mediaType === 'image') {
      insertImage(
        quillRef.current.getEditor(),
        mediaUrl,
        mediaCaption,
        mediaSize,
        mediaAlignment
      );
    } else {
      insertVideo(
        quillRef.current.getEditor(),
        mediaUrl,
        mediaCaption,
        mediaSize,
        mediaAlignment
      );
    }
    
    // Reset modal and close
    setMediaUrl('');
    setMediaCaption('');
    setMediaModalOpen(false);
  };
  
  // Add this useEffect to sync content from editor to preview
  useEffect(() => {
    if (showPreview && quillRef.current) {
      // Get the latest content from editor for preview
      const latestContent = quillRef.current.getHTML();
      
      // Update the form data with latest content to ensure preview is accurate
      setFormData(prev => ({
        ...prev,
        content: latestContent
      }));
    }
  }, [showPreview]);
  
  // Enhance the preview toggle button to update content first
  const togglePreview = () => {
    // If switching to preview, make sure we capture the latest content
    if (!showPreview && quillRef.current) {
      const latestContent = quillRef.current.getHTML();
      setFormData(prev => ({
        ...prev,
        content: latestContent
      }));
    }
    setShowPreview(!showPreview);
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner className="w-8 h-8 text-indigo-600 mx-auto" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Show admin-only warning if user is not admin */}
      {userProfile && userProfile.role !== 'admin' && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
          <p>This feature is only available to admin users. Your changes will not be saved.</p>
        </div>
      )}
      
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/articles" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Article' : 'Create New Article'}
          </h2>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={togglePreview}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Edit Article' : 'Preview'}
          </button>
          
          <Link 
            to="/admin/articles"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          
          {/* Save as Draft button */}
          <button
            type="button"
            onClick={saveAsDraft}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {saving && !formData.published ? (
              <>
                <Spinner className="w-4 h-4 text-gray-400" />
                Saving...
              </>
            ) : (
              'Save as Draft'
            )}
          </button>
          
          {/* Publish button */}
          <button
            type="button"
            onClick={publishArticle}
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {saving && formData.published ? (
              <>
                <Spinner className="w-4 h-4" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Publish
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Status message */}
      {saveStatus === 'success' && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <div className="mr-2 flex-shrink-0">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p>{statusMessage}</p>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <div className="mr-2 flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p>{statusMessage}</p>
        </div>
      )}
      
      {/* Preview Mode */}
      {showPreview ? (
        <div className="article-preview bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">{formData.title}</h1>
              
              <div className="flex flex-wrap items-center text-gray-600 mb-4 text-sm">
                <div className="flex items-center gap-1 mr-4">
                  <User className="w-4 h-4" />
                  <span>{formData.author || 'Anonymous'}</span>
                </div>
                
                <div className="flex items-center gap-1 mr-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formData.publicationDate || new Date().toLocaleDateString()}</span>
                </div>
                
                {formData.category && (
                  <div className="mt-1 sm:mt-0">
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded capitalize">
                      {formData.category.replace('-', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </header>
            
            {/* Featured Image */}
            {formData.image && (
              <figure className="mb-8">
                <img 
                  src={formData.image} 
                  alt={formData.title} 
                  className="w-full h-auto object-cover rounded-lg shadow-sm" 
                />
              </figure>
            )}
            
            {/* Article Body */}
            <div 
              className="article-content prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 
                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline 
                prose-img:rounded-lg prose-img:shadow-sm
                prose-code:bg-gray-50 prose-code:p-1 prose-code:rounded 
                prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 
                prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:font-normal"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
            
            {/* Tags */}
            {formData.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Media Section */}
            {(formData.additionalImages.length > 0 || formData.videos.length > 0) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                {formData.additionalImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Image Gallery</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.additionalImages.map((img, idx) => (
                        <figure key={idx} className="relative">
                          <img 
                            src={img} 
                            alt={`Additional image ${idx + 1}`}
                            className="w-full h-48 object-cover rounded-lg shadow-sm"
                          />
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Videos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {formData.videos.map((video, idx) => (
                        <div key={idx} className="aspect-w-16 aspect-h-9">
                          <video 
                            src={video}
                            controls
                            className="rounded-lg shadow-sm object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Preview Controls */}
            <div className="fixed bottom-4 right-4 flex gap-2">
              <button
                onClick={togglePreview}
                className="bg-white text-gray-700 border border-gray-300 shadow-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Editor
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form content... */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Enter article title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>
          
          {/* Author field */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              Author*
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border ${
                  errors.author ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Enter author name"
              />
            </div>
            {errors.author && (
              <p className="mt-1 text-sm text-red-500">{errors.author}</p>
            )}
          </div>
          
          {/* Publication Date field */}
          <div>
            <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700 mb-1">
              Publication Date (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="publicationDate"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to use the current date
            </p>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="content-editor" className="block text-sm font-medium text-gray-700 mb-1">
              Content*
            </label>
            
            <div className={`${errors.content ? 'border border-red-500 rounded-lg' : ''}`}>
              <DirectQuill
                ref={quillRef}
                theme="snow"
                value={formData.content}
                modules={{
                  toolbar: {
                    container: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      [{ 'indent': '-1' }, { 'indent': '+1' }],
                      [{ 'size': ['small', false, 'large', 'huge'] }],
                      [{ 'align': [] }],
                      ['link', 'image', 'video'],
                      ['clean']
                    ],
                    handlers: {
                      image: function() {
                        setMediaType('image');
                        setMediaModalOpen(true);
                      },
                      video: function() {
                        setMediaType('video');
                        setMediaModalOpen(true);
                      }
                    }
                  }
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet', 'ordered', 'indent',
                  'size', 'align',
                  'link', 'image', 'video',
                  'clean'
                ]}
                onChange={handleEditorChange}
                onChangeSelection={checkActiveFormats}
                className="min-h-[300px]"
              />
            </div>
            
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content}</p>
            )}
            
            <p className="mt-2 text-xs text-gray-500">
              Use the toolbar to format text and add media to your article.
            </p>
          </div>
          
          {/* Rest of the form... */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex items-center mb-2">
              <input
                type="text"
                id="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700 flex items-center justify-center h-[42px]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Featured Media */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Featured Media (optional)
            </label>
            <div className="space-y-3">
              {/* Media Type Selection */}
              <div className="flex gap-3 items-center mb-2">
                <div className="text-sm text-gray-600">Type:</div>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    checked={featuredMediaType === 'image'}
                    onChange={() => setFeaturedMediaType('image')}
                  />
                  <span className="ml-2">Image</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    checked={featuredMediaType === 'video'}
                    onChange={() => setFeaturedMediaType('video')}
                  />
                  <span className="ml-2">Video</span>
                </label>
              </div>
            
              {/* Media preview */}
              {formData.image && (
                <div className="relative rounded-lg border border-gray-300 p-1 inline-block">
                  {formData.image.match(/\.(mp4|webm|ogg)($|\?)/) ? (
                    <video
                      src={formData.image}
                      controls
                      className="h-40 w-auto object-cover rounded"
                      onError={() => {
                        displayErrorMessage('Error loading video. Please check the URL.');
                      }}
                    />
                  ) : (
                    <img 
                      src={formData.image} 
                      alt="Featured" 
                      className="h-40 w-auto object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder-image.jpg';
                        displayErrorMessage('Error loading image. Using placeholder instead.');
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        image: null
                      }));
                    }}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-100"
                    title="Remove media"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Rest of the media controls and other form elements... */}
            </div>
          </div>
        </form>
      )}
      
      {/* Media Insertion Modal */}
      {mediaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Insert {mediaType === 'image' ? 'Image' : 'Video'}
              </h3>
              <button 
                type="button" 
                onClick={() => setMediaModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="media-url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  id="media-url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Enter ${mediaType} URL`}
                />
              </div>
              
              <div>
                <label htmlFor="media-caption" className="block text-sm font-medium text-gray-700 mb-1">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  id="media-caption"
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter caption"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <div className="flex space-x-4">
                  {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                    <label key={size} className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-indigo-600"
                        checked={mediaSize === size}
                        onChange={() => setMediaSize(size)}
                      />
                      <span className="ml-2 capitalize">{size}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignment
                </label>
                <div className="flex space-x-4">
                  {(['left', 'center', 'right'] as const).map((alignment) => (
                    <label key={alignment} className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-indigo-600"
                        checked={mediaAlignment === alignment}
                        onChange={() => setMediaAlignment(alignment)}
                      />
                      <span className="ml-2 capitalize">{alignment}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertMediaToEditor}
                  disabled={!mediaUrl}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 