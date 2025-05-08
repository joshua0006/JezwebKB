import { useState, useEffect, FormEvent, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArticleFormData } from '../types/article';
import { Category } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { createArticle, getArticleById, updateArticle } from '../services/articleService';
import { Spinner } from './Spinner';
import { X, Plus, Save, ArrowLeft, Bold, Italic, Underline, ListOrdered, List, Link as LinkIcon, Type, ExternalLink, AlertTriangle, Upload, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { uploadImage } from '../services/storageService';

// Using a contentEditable div for rich text editing
// This gives us real-time formatting display

const initialFormData: ArticleFormData = {
  title: '',
  content: '',
  category: 'general',
  tags: [],
  published: false,
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
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [currentSelection, setCurrentSelection] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const activeSelectionRef = useRef<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontSize: string;
    orderedList: boolean;
    unorderedList: boolean;
    link: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    fontSize: 'normal',
    orderedList: false,
    unorderedList: false,
    link: false
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Use a state variable to track when content is ready to be rendered
  const [contentToRender, setContentToRender] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Traditional useEffect to handle content rendering when the editor element is available
  useEffect(() => {
    if (editorRef.current && contentToRender) {
      try {
        // Clear editor first
        editorRef.current.innerHTML = '';
        
        // Decode any HTML entities in the content
        const decodedContent = decodeHtmlEntities(contentToRender);
        logContentDebug('Decoded (in render effect)', decodedContent);
        
        // Sanitize content as a precaution
        const sanitizedContent = sanitizeHtml(decodedContent);
        
        // Set the content in the editor
        editorRef.current.innerHTML = sanitizedContent;
        logContentDebug('Applied (in render effect)', editorRef.current.innerHTML);
        
        // Clear the content to render to avoid re-applying
        setContentToRender(null);
        
        // Check formats after a delay
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.focus();
            checkActiveFormats();
          }
        }, 100);
      } catch (error) {
        console.error('Error setting editor content in effect:', error);
        
        // Fallback to simple text if HTML fails
        try {
          if (editorRef.current) {
            editorRef.current.textContent = contentToRender;
            setContentToRender(null);
          }
        } catch (fallbackError) {
          console.error('Even fallback content setting failed:', fallbackError);
        }
      }
    }
  }, [contentToRender]);

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
          });
          
          // Set the content to be rendered once the editor is ready
          if (article.content) {
            setContentToRender(article.content);
            console.log('Content ready for rendering in editor');
          } else {
            console.warn('No content available to render');
          }
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
  
  // Capture content from editor
  const updateContentFromEditor = () => {
    if (editorRef.current) {
      setFormData(prev => ({
        ...prev,
        content: editorRef.current?.innerHTML || ''
      }));
      
      // Clear error when field is edited
      if (errors.content) {
        setErrors(prev => ({ ...prev, content: undefined }));
      }
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
    
    // Get content from editor before validation
    updateContentFromEditor();
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Function to handle save status message display
  const displayErrorMessage = (message: string) => {
    setSaveStatus('error');
    setStatusMessage(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    // Make sure we capture the latest content from editor
    updateContentFromEditor();
    
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
      
      // Get editor content, ensuring it's properly processed
      let editorContent = '';
      if (editorRef.current) {
        // Capture the raw HTML content
        editorContent = editorRef.current.innerHTML || '<p>No content</p>';
        
        // Clean up any empty paragraphs that might have been created
        editorContent = editorContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
        
        // Log the content being saved for debugging
        logContentDebug('Saving', editorContent);
      } else {
        // Fallback to the content in formData
        editorContent = formData.content || '<p>No content</p>';
      }
      
      // Update the published state based on the button clicked
      const articleData = {
        ...formData,
        published: publish,
        // Ensure all required fields are present
        title: formData.title.trim() || 'Untitled',
        content: editorContent, // Use the cleaned HTML content
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
    await saveArticle(formData.published);
  };
  
  // Publish article
  const publishArticle = async () => {
    await saveArticle(true);
  };
  
  // Save as draft
  const saveAsDraft = async () => {
    await saveArticle(false);
  };
  
  // Check for active formats when selection changes
  const checkActiveFormats = () => {
    if (!document.queryCommandSupported) return;
    
    // Save the current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      activeSelectionRef.current = selection.getRangeAt(0).cloneRange();
      setCurrentSelection(selection.toString());
    }
    
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      fontSize: getFontSize(),
      orderedList: document.queryCommandState('insertOrderedList'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      link: document.queryCommandState('createLink')
    });
  };

  // Helper to check the font size of current selection
  const getFontSize = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'normal';
    
    let element = selection.anchorNode;
    
    // Navigate up to element node if we're in a text node
    if (element?.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    
    // Check the font size
    if (element instanceof HTMLElement) {
      const fontSize = window.getComputedStyle(element).fontSize;
      if (fontSize === '24px' || fontSize === '1.5rem') return 'large';
      if (fontSize === '18px' || fontSize === '1.125rem') return 'medium';
      if (fontSize === '14px' || fontSize === '0.875rem') return 'small';
    }
    
    return 'normal';
  };
  
  // Apply font size
  const applyFontSize = (size: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      try {
        // Map sizes to HTML tags/styles
        switch (size) {
          case 'small':
            document.execCommand('fontSize', false, '2'); // Small
            break;
          case 'normal':
            document.execCommand('fontSize', false, '3'); // Normal
            break;
          case 'medium':
            document.execCommand('fontSize', false, '4'); // Medium
            break;
          case 'large':
            document.execCommand('fontSize', false, '5'); // Large
            break;
        }
        
        updateContentFromEditor();
        setFontSizeMenuOpen(false);
        checkActiveFormats();
      } catch (err) {
        console.error('Error applying font size:', err);
      }
    }
  };
  
  // Apply text formatting
  const applyFormatting = (command: string, value: string = '') => {
    // Make sure editor is focused
    if (editorRef.current) {
      editorRef.current.focus();
      
      try {
        document.execCommand(command, false, value);
        updateContentFromEditor();
        checkActiveFormats(); // Check formats after applying
      } catch (err) {
        console.error('Error applying formatting:', err);
      }
    }
  };
  
  // Function to handle link insertion or updating
  const openLinkModal = () => {
    const selection = window.getSelection();
    
    // If there's no selection but link format is active, we're editing an existing link
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      setLinkText(selectedText);
      
      // Check if current selection is part of a link
      let element = selection.anchorNode;
      
      // Navigate up to element node if we're in a text node
      if (element?.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }
      
      // Look for link element
      while (element && element !== editorRef.current) {
        if (element instanceof HTMLElement && element.tagName === 'A') {
          setLinkUrl(element.getAttribute('href') || '');
          break;
        }
        element = element?.parentElement || null;
      }
      
      // If no link found but we have selection, prepare for new link
      if (!(element instanceof HTMLElement && element.tagName === 'A')) {
        setLinkUrl('https://');
      }
    } else {
      // Default for new link
      setLinkUrl('https://');
      setLinkText('');
    }
    
    setLinkModalOpen(true);
    
    // Focus the input after modal opens
    setTimeout(() => {
      if (linkInputRef.current) {
        linkInputRef.current.focus();
        linkInputRef.current.select();
      }
    }, 10);
  };
  
  // Apply the link to the editor
  const applyLink = () => {
    if (!editorRef.current) return;
    
    // Focus the editor
    editorRef.current.focus();
    
    // If we have a saved selection, restore it
    if (activeSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(activeSelectionRef.current);
      }
    }
    
    // If no text is selected but link text is provided, insert it
    if (currentSelection === '' && linkText) {
      document.execCommand('insertHTML', false, `<a href="${linkUrl}" target="_blank">${linkText}</a>`);
    } else if (linkUrl) {
      document.execCommand('createLink', false, linkUrl);
      
      // Set target="_blank" on all links
      const links = editorRef.current.querySelectorAll('a');
      links.forEach(link => {
        link.setAttribute('target', '_blank');
      });
    }
    
    // Close modal and update content
    setLinkModalOpen(false);
    updateContentFromEditor();
    checkActiveFormats();
  };
  
  // Remove a link
  const removeLink = () => {
    if (!editorRef.current) return;
    
    // Focus the editor
    editorRef.current.focus();
    
    // If we have a saved selection, restore it
    if (activeSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(activeSelectionRef.current);
      }
    }
    
    document.execCommand('unlink', false);
    setLinkModalOpen(false);
    updateContentFromEditor();
    checkActiveFormats();
  };
  
  // Handle image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      displayErrorMessage('Only image files are allowed');
      return;
    }
    
    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      displayErrorMessage('Image size should be less than 5MB');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Upload image to Firebase Storage
      const imageUrl = await uploadImage(
        file, 
        `articles/${new Date().getTime()}_${file.name}`,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({
        ...prev,
        image: imageUrl
      }));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      displayErrorMessage('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Remove the image
  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
          
          {/* Formatting toolbar */}
          <div className="mb-2 border border-gray-300 rounded-t-lg bg-gray-50 p-1 flex flex-wrap items-center">
            <button
              type="button"
              onClick={() => applyFormatting('bold')}
              className={`p-2 rounded ${activeFormats.bold ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('italic')}
              className={`p-2 rounded ${activeFormats.italic ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('underline')}
              className={`p-2 rounded ${activeFormats.underline ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            
            {/* Font size dropdown */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setFontSizeMenuOpen(!fontSizeMenuOpen)}
                className="p-2 rounded flex items-center hover:bg-gray-200"
                title="Font Size"
              >
                <Type className="w-4 h-4" />
                <span className="ml-1 text-xs">
                  {activeFormats.fontSize === 'small' && 'Small'}
                  {activeFormats.fontSize === 'normal' && 'Normal'}
                  {activeFormats.fontSize === 'medium' && 'Medium'}
                  {activeFormats.fontSize === 'large' && 'Large'}
                </span>
              </button>
              
              {fontSizeMenuOpen && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded shadow-lg py-1 w-32">
                  <button
                    type="button"
                    onClick={() => applyFontSize('small')}
                    className={`w-full px-3 py-1 text-left text-sm ${
                      activeFormats.fontSize === 'small' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                    style={{ fontSize: '0.875rem' }}
                  >
                    Small
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('normal')}
                    className={`w-full px-3 py-1 text-left text-sm ${
                      activeFormats.fontSize === 'normal' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                    style={{ fontSize: '1rem' }}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('medium')}
                    className={`w-full px-3 py-1 text-left text-sm ${
                      activeFormats.fontSize === 'medium' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                    style={{ fontSize: '1.125rem' }}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('large')}
                    className={`w-full px-3 py-1 text-left text-sm ${
                      activeFormats.fontSize === 'large' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                    }`}
                    style={{ fontSize: '1.5rem' }}
                  >
                    Large
                  </button>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => applyFormatting('insertOrderedList')}
              className={`p-2 rounded ${activeFormats.orderedList ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('insertUnorderedList')}
              className={`p-2 rounded ${activeFormats.unorderedList ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={openLinkModal}
              className={`p-2 rounded ${activeFormats.link ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200'}`}
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Rich text editor */}
          <div
            id="content-editor"
            ref={editorRef}
            contentEditable
            onInput={updateContentFromEditor}
            onBlur={(e) => {
              updateContentFromEditor();
              // Close the font size menu when clicking outside
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setFontSizeMenuOpen(false);
              }
            }}
            onKeyUp={checkActiveFormats}
            onMouseUp={checkActiveFormats}
            onSelect={checkActiveFormats}
            className={`w-full px-3 py-2 border ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            } border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[300px] prose prose-sm max-w-none overflow-auto`}
            style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
            data-editor-initialized={Boolean(editorRef.current)}
            data-content-length={formData.content?.length || 0}
            data-edit-mode={isEditing ? 'edit' : 'create'}
          />
          
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{errors.content}</p>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            Use the formatting toolbar to style your content.
          </p>
        </div>
        
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
        
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image (optional)
          </label>
          <div className="space-y-3">
            {/* Image preview */}
            {formData.image && (
              <div className="relative rounded-lg border border-gray-300 p-1 inline-block">
                <img 
                  src={formData.image} 
                  alt="Featured" 
                  className="h-40 w-auto object-cover rounded"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full hover:bg-opacity-100"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {/* URL input */}
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="image"
                      name="image"
                      value={formData.image || ''}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter image URL"
                    />
                  </div>
                </div>
              </div>
              
              {/* Upload button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  disabled={uploading}
                  className={`flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg ${
                    uploading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Spinner className="w-4 h-4 text-gray-400" />
                      {uploadProgress < 100 ? `${uploadProgress}%` : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              Upload an image (max 5MB) or enter a URL. Recommended size: 1200×630 pixels.
            </p>
          </div>
        </div>
        
        {/* Link Modal */}
        {linkModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeFormats.link ? 'Edit Link' : 'Insert Link'}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setLinkModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="link-text" className="block text-sm font-medium text-gray-700 mb-1">
                    Link Text
                  </label>
                  <input
                    type="text"
                    id="link-text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Text to display"
                  />
                </div>
                
                <div>
                  <label htmlFor="link-url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <div className="flex items-stretch">
  <input
    ref={linkInputRef}
    type="text"
    id="link-url"
    value={linkUrl}
    onChange={(e) => setLinkUrl(e.target.value)}
    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
    placeholder="https://example.com"
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyLink();
      }
    }}
  />
  {linkUrl && (
    <a 
      href={linkUrl}
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center px-3 border border-gray-300 border-l-0 rounded-r-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
      title="Test link"
    >
      <ExternalLink className="w-4 h-4" />
    </a>
  )}
</div>

                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  {activeFormats.link && (
                    <button
                      type="button"
                      onClick={removeLink}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                    >
                      Remove Link
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLinkModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyLink}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {activeFormats.link ? 'Update' : 'Insert'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 