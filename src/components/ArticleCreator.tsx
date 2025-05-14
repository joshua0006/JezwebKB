import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Heading from '@tiptap/extension-heading';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import { ArticleFormData } from '../types/article';
import { Category } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { createArticle, updateArticle, getArticleById, getAllCategories } from '../services/articleService';
import { uploadImage, uploadVideo } from '../services/storageService';
import { format } from 'date-fns';
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon,
  Highlighter, Save, Eye, X, Plus, ArrowLeft, Calendar, Tag, Upload, Trash2, Monitor
} from 'lucide-react';

// Browser detection for video compatibility
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = '';
  let version = '';
  
  // Safari
  if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'safari';
    version = userAgent.match(/Version\/([\d.]+)/)?.[1] || '';
  }
  // Edge
  else if (userAgent.indexOf('Edg') !== -1) {
    browser = 'edge';
    version = userAgent.match(/Edg\/([\d.]+)/)?.[1] || '';
  }
  // Chrome
  else if (userAgent.indexOf('Chrome') !== -1) {
    browser = 'chrome';
    version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || '';
  }
  // Firefox
  else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'firefox';
    version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || '';
  }
  // IE
  else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) {
    browser = 'ie';
    version = userAgent.match(/(?:MSIE |rv:)([\d.]+)/)?.[1] || '';
  }
  
  return { browser, version };
};

// Create a function to detect browser video capabilities more thoroughly
const detectVideoCapabilities = () => {
  const videoElement = document.createElement('video');
  
  // Check if browser supports HTML5 video at all
  const hasVideoSupport = !!videoElement.canPlayType;
  
  // Check support for different video formats
  const supportedFormats = {
    mp4: videoElement.canPlayType('video/mp4').replace(/no/, ''),
    webm: videoElement.canPlayType('video/webm').replace(/no/, ''),
    ogg: videoElement.canPlayType('video/ogg').replace(/no/, ''),
    hls: videoElement.canPlayType('application/vnd.apple.mpegurl').replace(/no/, ''),
    dash: videoElement.canPlayType('application/dash+xml').replace(/no/, '')
  };
  
  return {
    hasVideoSupport,
    supportedFormats
  };
};

// Get appropriate video format based on browser capabilities
const getVideoFormat = (browser: string) => {
  const capabilities = detectVideoCapabilities();
  
  // Prioritize formats based on browser and capabilities
  if (capabilities.supportedFormats.webm) return 'video/webm';
  if (capabilities.supportedFormats.mp4) return 'video/mp4';
  if (capabilities.supportedFormats.ogg) return 'video/ogg';
  
  // Fallback to browser-specific preferences
  switch(browser) {
    case 'safari':
      return 'video/mp4';
    case 'firefox':
      return 'video/webm';
    default:
      return 'video/mp4';
  }
};

// Check if a video format is supported by the browser
const isVideoFormatSupported = (format: string): boolean => {
  const video = document.createElement('video');
  return video.canPlayType(format) !== '';
};

// Get an array of supported video formats for the current browser
const getSupportedVideoFormats = (): string[] => {
  const formats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/x-m4v',
    'video/quicktime'
  ];
  
  return formats.filter(format => isVideoFormatSupported(format));
};

// Create a custom function to create a video with proper fallback
const createVideoElement = (url: string, type: string, caption: string, size: string, alignment: string): string => {
  // Get all supported formats
  const capabilities = detectVideoCapabilities();
  const supportedFormats = getSupportedVideoFormats();
  
  // Create fallback content for browsers without video support
  const fallbackContent = `
    <div class="video-fallback-container">
      <div class="video-fallback-message p-4 border rounded bg-gray-100">
        <p class="mb-2 font-medium">Your browser doesn't support HTML5 video.</p>
        <a href="${url}" 
           download
           class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Download Video
        </a>
        <a href="${url}" 
           target="_blank" 
           rel="noopener noreferrer"
           class="inline-block ml-2 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors">
          Open Video in New Tab
        </a>
      </div>
    </div>
  `;
  
  // Create sources for all supported formats
  const sourcesHtml = supportedFormats
    .map(format => `<source src="${url}" type="${format}">`)
    .join('\n');
  
  // Create the video element with multiple formats and enhanced error handling
  return `
    <div class="video-wrapper" contenteditable="false">
      <figure class="media-container ${alignment}" data-type="video-container">
        <video 
          width="640" 
          height="360" 
          controls 
          class="quill-video size-${size}" 
          preload="metadata" 
          playsInline
          controlsList="nodownload"
          oncontextmenu="return false;"
        >
          <source src="${url}" type="${type}">
          ${sourcesHtml}
          ${fallbackContent}
        </video>
        ${caption ? `<figcaption class="media-caption">${caption}</figcaption>` : ''}
      </figure>
    </div>
  `;
};

// Create a key for localStorage to store the article data
const PREVIEW_STORAGE_KEY = 'articlePreviewData';

// Helper function to safely update storage
const safelyUpdateStorage = (data: any, previewRef: React.MutableRefObject<Window | null>) => {
  try {
    // Create a copy of the data to avoid modifying the original
    const dataToStore = { ...data };
    
    // Always prioritize direct communication with preview window if available
    if (previewRef.current && !previewRef.current.closed) {
      try {
        previewRef.current.postMessage({
          type: 'article-update-direct',
          articleData: dataToStore,
          timestamp: new Date().getTime()
        }, '*');
        
        // If direct communication succeeds, we can avoid storage altogether
        return;
      } catch (e) {
        console.log('Direct preview communication failed, falling back to storage', e);
      }
    }
    
    // Always use sessionStorage instead of localStorage to avoid persistent quota issues
    const storageToUse = sessionStorage;
    
    // If content is large, compress it more aggressively
    if (dataToStore.content && dataToStore.content.length > 50000) {
      // For preview, we don't need to store the entire content - just create a minimal version
      const minimalContent = {
        title: dataToStore.title || 'Untitled Article',
        author: dataToStore.author,
        category: dataToStore.category,
        tags: dataToStore.tags,
        publicationDate: dataToStore.publicationDate,
        headerMedia: dataToStore.headerMedia,
        lastUpdated: new Date().toISOString(),
        // Only keep essential content for the preview
        content: '<p>Content available in full preview. Use the "Full Article Preview" button for best experience.</p>',
        // Add a flag to indicate this is truncated
        isMinimalVersion: true
      };
      
      // Store the minimal data
      storageToUse.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(minimalContent));
    } else {
      // Small content can be stored as is
      storageToUse.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  } catch (error) {
    console.error('Error updating preview storage:', error);
    
    // If all storage methods fail, only store minimal metadata
    try {
      const minimalData = {
        title: data.title || 'Untitled Article',
        author: data.author,
        category: data.category,
        tags: data.tags,
        publicationDate: data.publicationDate,
        headerMedia: data.headerMedia,
        lastUpdated: new Date().toISOString(),
        isMinimalVersion: true,
        content: '<p>Storage quota exceeded. Please use the "Full Article Preview" button for complete content.</p>'
      };
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(minimalData));
    } catch (fallbackError) {
      console.error('Even fallback storage failed:', fallbackError);
    }
  }
};

/**
 * Initial form data for the article creator
 */
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
  headerMedia: null,
};

interface ArticleCreatorProps {
  articleId?: string;
}

// Link Dialog Component
interface LinkDialogProps {
  isOpen: boolean;
  initialUrl: string;
  onClose: () => void;
  onSave: (url: string) => void;
  onRemove?: () => void;
}

const LinkDialog: React.FC<LinkDialogProps> = ({ isOpen, initialUrl, onClose, onSave, onRemove }) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setUrl(initialUrl || '');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isOpen, initialUrl]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate and format the URL
    if (url.trim() === '') {
      onSave(''); // Empty URL means remove link
      return;
    }
    
    let processedUrl = url.trim();
    
    // Check if URL has a protocol
    if (!/^(https?:\/\/|mailto:|tel:|ftp:|\/)/.test(processedUrl)) {
      // Add https:// protocol if missing
      processedUrl = 'https://' + processedUrl;
    }
    
    // Basic URL validation
    try {
      new URL(processedUrl);
      onSave(processedUrl);
    } catch (e) {
      // If it's not a valid URL even after adding https://, show an error
      setError('Please enter a valid URL');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium mb-4">Insert Link</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="text"
              id="url"
              ref={inputRef}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="https://example.com"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Tip: If you don't include http:// or https://, https:// will be added automatically.
            </p>
          </div>
          <div className="flex justify-between">
            <div>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Remove Link
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ArticleCreator component for creating and editing articles
 * Uses Tiptap editor for rich text editing
 */
export const ArticleCreator: React.FC<ArticleCreatorProps> = ({ articleId }) => {
  // Move the categories state inside the component
  const [categories, setCategories] = useState<{ value: Category; label: string }[]>([
    { value: 'general', label: 'General' }, // Default category
  ]);
  
  const [formData, setFormData] = useState<ArticleFormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [fullArticlePreview, setFullArticlePreview] = useState<boolean>(false);
  const [tag, setTag] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [lastEditorUpdate, setLastEditorUpdate] = useState<number>(Date.now());
  const [linkDialogOpen, setLinkDialogOpen] = useState<boolean>(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState<string>('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const headerMediaInputRef = useRef<HTMLInputElement>(null);
  const headerDropAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // For storing the preview window reference
  const previewWindowRef = useRef<Window | null>(null);

  // Browser detection for video compatibility
  const [browserInfo, setBrowserInfo] = useState<{ browser: string; version: string }>({ browser: '', version: '' });
  
  // Detect browser on component mount
  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);
  
  /**
   * Fetch categories from Firebase
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        if (fetchedCategories.length > 0) {
          setCategories(fetchedCategories.map(category => ({
            value: category.id,
            label: category.name
          })));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to create or edit articles. Please sign in to continue.');
    } else {
      setError(null);
    }
  }, [user]);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        nocookie: true,
      }),
      Underline,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setFormData(prev => {
        const updated = { ...prev, content: newContent };
        
        // Force preview refresh
        setLastEditorUpdate(Date.now());
        
        // If preview window exists, prioritize direct communication
        if (previewWindowRef.current && !previewWindowRef.current.closed) {
          try {
            // Send all article data directly to avoid storage limitations
            previewWindowRef.current.postMessage({
              type: 'article-update-direct',
              articleData: {
                ...updated,
                content: newContent,
                lastUpdated: new Date().toISOString()
              },
              timestamp: Date.now()
            }, '*');
          } catch (e) {
            // If direct communication fails, fallback to storage method
            console.warn('Direct preview communication failed, using storage fallback', e);
            safelyUpdateStorage({
              ...updated,
              content: newContent,
              lastUpdated: new Date().toISOString()
            }, previewWindowRef);
          }
        } else {
          // No preview window, update storage as fallback
          safelyUpdateStorage({
            ...updated,
            content: newContent,
            lastUpdated: new Date().toISOString()
          }, previewWindowRef);
        }
        
        return updated;
      });
    },
  });

  // Initialize video elements after editor changes
  useEffect(() => {
    if (!editor) return;
    
    // Add a listener for content changes to handle video elements
    const handleUpdate = () => {
      if (!editor.view || !editor.view.dom) return;
      
      // Get all video elements in the editor
      const videos = editor.view.dom.querySelectorAll('video') as NodeListOf<HTMLVideoElement>;
      
      videos.forEach(video => {
        // Add error handling if not already present
        if (!video.onerror) {
          video.onerror = (e) => {
            console.error('Video error:', e);
            // Create enhanced fallback content
            const fallback = document.createElement('div');
            fallback.className = 'video-error p-4 border rounded bg-gray-100';
            fallback.innerHTML = `
              <div class="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p class="mb-2 font-medium">Video unavailable</p>
                <div class="flex justify-center space-x-2">
                  <a href="${video.querySelector('source')?.src || ''}" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Open in new tab
                  </a>
                  <button 
                    class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors retry-video-btn">
                    Retry
                  </button>
                </div>
              </div>
            `;
            
            // Replace the video element with the fallback
            if (video.parentElement) {
              video.parentElement.replaceChild(fallback, video);
              
              // Add event listener to the retry button
              const retryButton = fallback.querySelector('.retry-video-btn');
              if (retryButton) {
                retryButton.addEventListener('click', () => {
                  const videoSrc = video.querySelector('source')?.src || '';
                  if (videoSrc) {
                    // Create a new video element
                    const newVideo = document.createElement('video');
                    newVideo.controls = true;
                    newVideo.playsInline = true;
                    newVideo.preload = 'metadata';
                    newVideo.className = video.className;
                    newVideo.width = video.width;
                    newVideo.height = video.height;
                    
                    // Add sources
                    const supportedFormats = getSupportedVideoFormats();
                    supportedFormats.forEach(format => {
                      const source = document.createElement('source');
                      source.src = videoSrc;
                      source.type = format;
                      newVideo.appendChild(source);
                    });
                    
                    // Replace fallback with new video
                    fallback.parentElement?.replaceChild(newVideo, fallback);
                  }
                });
              }
            }
          };
        }
        
        // Add load event handler for success
        if (!video.onloadeddata) {
          video.onloadeddata = () => {
            video.classList.add('video-loaded');
          };
        }
        
        // Ensure preload is set for better performance
        if (!video.hasAttribute('preload')) {
          video.setAttribute('preload', 'metadata');
        }
        
        // Make sure controls are visible
        if (!video.hasAttribute('controls')) {
          video.setAttribute('controls', 'true');
        }
        
        // Enable playsinline for mobile compatibility
        if (!video.hasAttribute('playsInline')) {
          video.setAttribute('playsInline', 'true');
        }
        
        // Add an audio track for accessibility if one doesn't exist
        if (video.textTracks.length === 0) {
          video.setAttribute('crossorigin', 'anonymous');
        }
      });
    };
    
    const onTransaction = () => {
      // Schedule video initialization after the DOM has been updated
      setTimeout(handleUpdate, 0);
    };
    
    editor.on('transaction', onTransaction);
    
    return () => {
      editor.off('transaction', onTransaction);
    };
  }, [editor]);

  // Fetch article if editing or set default date for new article
  useEffect(() => {
    if (articleId) {
      fetchArticle();
    } else if (!formData.publicationDate) {
      // Set default date for new article
      const today = new Date();
      setFormData(prev => ({
        ...prev,
        publicationDate: format(today, 'yyyy-MM-dd'),
        author: user?.displayName || ''
      }));
    }
  }, [articleId, user]);

  /**
   * Fetch article data from the server when editing an existing article
   */
  const fetchArticle = async () => {
    if (!articleId) return;
    
    try {
      setLoading(true);
      const article = await getArticleById(articleId);
      
      if (article) {
        // Create a date string for the publication date
        const dateObject = article.createdAt ? new Date(article.createdAt) : new Date();
        
        setFormData({
          title: article.title || '',
          content: article.content || '',
          category: article.category || 'general',
          tags: article.tags || [],
          published: article.published || false,
          author: article.createdBy || user?.displayName || '',
          publicationDate: format(dateObject, 'yyyy-MM-dd'),
          additionalImages: article.additionalImages || [],
          videos: article.videos || [],
          image: article.image || null,
          headerMedia: article.headerMedia || null
        });
        
        // Update editor content
        if (editor && article.content) {
          editor.commands.setContent(article.content);
        }
      }
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input change for form fields
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // If preview window exists, prioritize direct communication
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        try {
          previewWindowRef.current.postMessage({
            type: 'article-update-direct',
            articleData: {
              ...updated,
              content: editor?.getHTML() || updated.content,
              lastUpdated: new Date().toISOString()
            },
            timestamp: Date.now()
          }, '*');
        } catch (e) {
          // If direct communication fails, fallback to storage method
          safelyUpdateStorage({
            ...updated,
            content: editor?.getHTML() || updated.content,
            lastUpdated: new Date().toISOString()
          }, previewWindowRef);
        }
      } else {
        // No preview window, update storage as fallback
        safelyUpdateStorage({
          ...updated,
          content: editor?.getHTML() || updated.content,
          lastUpdated: new Date().toISOString()
        }, previewWindowRef);
      }
      
      return updated;
    });
  };

  /**
   * Add a tag to the article
   */
  const addTag = () => {
    if (!tag.trim()) return;
    if (!formData.tags.includes(tag.trim())) {
      setFormData(prev => {
        const updated = {
          ...prev,
          tags: [...prev.tags, tag.trim()]
        };
        
        // If preview window exists, prioritize direct communication
        if (previewWindowRef.current && !previewWindowRef.current.closed) {
          try {
            previewWindowRef.current.postMessage({
              type: 'article-update-direct',
              articleData: {
                ...updated,
                content: editor?.getHTML() || updated.content,
                lastUpdated: new Date().toISOString()
              },
              timestamp: Date.now()
            }, '*');
          } catch (e) {
            // If direct communication fails, fallback to storage method
            safelyUpdateStorage({
              ...updated,
              content: editor?.getHTML() || updated.content,
              lastUpdated: new Date().toISOString()
            }, previewWindowRef);
          }
        } else {
          // No preview window, update storage as fallback
          safelyUpdateStorage({
            ...updated,
            content: editor?.getHTML() || updated.content,
            lastUpdated: new Date().toISOString()
          }, previewWindowRef);
        }
        
        return updated;
      });
    }
    setTag('');
  };

  /**
   * Remove a tag from the article
   */
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      };
      
      // If preview window exists, prioritize direct communication
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        try {
          previewWindowRef.current.postMessage({
            type: 'article-update-direct',
            articleData: {
              ...updated,
              content: editor?.getHTML() || updated.content,
              lastUpdated: new Date().toISOString()
            },
            timestamp: Date.now()
          }, '*');
        } catch (e) {
          // If direct communication fails, fallback to storage method
          safelyUpdateStorage({
            ...updated,
            content: editor?.getHTML() || updated.content,
            lastUpdated: new Date().toISOString()
          }, previewWindowRef);
        }
      } else {
        // No preview window, update storage as fallback
        safelyUpdateStorage({
          ...updated,
          content: editor?.getHTML() || updated.content,
          lastUpdated: new Date().toISOString()
        }, previewWindowRef);
      }
      
      return updated;
    });
  };

  /**
   * Save the article as draft or publish it
   */
  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!editor?.getHTML() || editor?.getHTML() === '<p></p>') {
      setError('Content is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const articleData = {
        ...formData,
        content: editor.getHTML(),
        published: publish
      };

      if (articleId) {
        await updateArticle(articleId, articleData);
        setSuccess(`Article "${formData.title}" has been updated successfully. Redirecting to home page...`);
      } else {
        await createArticle(articleData, user?.uid || '');
        setSuccess(`Article "${formData.title}" has been created successfully. Redirecting to home page...`);
      }

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error saving article:', err);
      setError('Failed to save article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check user authentication before attempting upload
    if (!user) {
      setError('You must be logged in to upload images. Please sign in and try again.');
      return;
    }

    try {
      setIsUploading(true);
      setMediaType('image');
      setError(null);

      const uploadFile = async (file: File) => {
        try {
          // Set exact path for the image - use a subfolder for better organization
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const path = `articles/images/${fileName}`;
          
          const url = await uploadImage(file, path, progress => {
            setUploadProgress(progress);
          });
          return url;
        } catch (err: any) {
          console.error('Error uploading image:', err);
          // Handle specific Firebase storage errors
          if (err.code === 'storage/unauthorized') {
            throw new Error('You do not have permission to upload images. Please check if you are logged in.');
          } else if (err.code === 'storage/canceled') {
            throw new Error('Upload was canceled');
          } else if (err.code === 'storage/unknown') {
            throw new Error('An unknown error occurred during upload');
          } else {
            throw err;
          }
        }
      };

      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i]);
        if (editor && url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }

      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Update header media and maintain preview sync
   */
  const updateHeaderMedia = (media: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        headerMedia: media
      };
      
      // If preview window exists, prioritize direct communication
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        try {
          previewWindowRef.current.postMessage({
            type: 'article-update-direct',
            articleData: {
              ...updated,
              content: editor?.getHTML() || updated.content,
              lastUpdated: new Date().toISOString()
            },
            timestamp: Date.now()
          }, '*');
        } catch (e) {
          // If direct communication fails, fallback to storage method
          safelyUpdateStorage({
            ...updated,
            content: editor?.getHTML() || updated.content,
            lastUpdated: new Date().toISOString()
          }, previewWindowRef);
        }
      } else {
        // No preview window, update storage as fallback
        safelyUpdateStorage({
          ...updated,
          content: editor?.getHTML() || updated.content,
          lastUpdated: new Date().toISOString()
        }, previewWindowRef);
      }
      
      return updated;
    });
  };

  /**
   * Handle header media upload
   */
  const handleHeaderMediaUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    
    if ('dataTransfer' in e) {
      files = e.dataTransfer?.files || null;
    } else {
      files = e.target.files;
    }
    
    if (!files || files.length === 0) return;

    // Check user authentication before attempting upload
    if (!user) {
      setError('You must be logged in to upload media. Please sign in and try again.');
      return;
    }

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setError('Invalid file type. Please select an image or video file.');
      return;
    }

    try {
      setIsUploading(true);
      setMediaType(isVideo ? 'video' : 'image');
      setError(null);

      const uploadMediaFile = async (file: File) => {
        try {
          // Set exact path for the media - use a subfolder for better organization
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const folder = isVideo ? 'videos' : 'images';
          const path = `articles/${folder}/${fileName}`;
          
          const uploadFn = isVideo ? uploadVideo : uploadImage;
          const url = await uploadFn(file, path, progress => {
            setUploadProgress(progress);
          });
          
          return { url, type: isVideo ? 'video' : 'image' };
        } catch (err: any) {
          console.error(`Error uploading ${isVideo ? 'video' : 'image'}:`, err);
          throw err;
        }
      };

      const { url, type } = await uploadMediaFile(file);
      
      // Update form data with the header media
      updateHeaderMedia({
        url,
        type: type as 'image' | 'video',
        caption: '',
        fileName: file.name
      });

      // Reset file input
      if (headerMediaInputRef.current) {
        headerMediaInputRef.current.value = '';
      }

    } catch (err: any) {
      console.error('Error uploading header media:', err);
      setError(err.message || 'Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setDragActive(false);
    }
  };

  /**
   * Remove header media
   */
  const removeHeaderMedia = () => {
    updateHeaderMedia(null);
  };

  /**
   * Set a link in the editor
   */
  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href || '';
    setCurrentLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  };
  
  const handleSaveLink = (url: string) => {
    if (!editor) return;
    
    // If URL is empty, remove the link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // Make one final check for valid URL to ensure it has protocol
      try {
        // Make sure URL has a protocol if it's a web URL
        let finalUrl = url;
        if (!/^(https?:\/\/|mailto:|tel:|ftp:|\/)/.test(finalUrl)) {
          finalUrl = 'https://' + finalUrl;
        }
        
        // Validate the URL
        new URL(finalUrl);
        
        // Update link with validated URL
        editor.chain().focus().extendMarkRange('link')
          .setLink({ href: finalUrl, target: '_blank' }).run();
      } catch (e) {
        // If URL is not valid, don't update the link and log an error
        console.error('Invalid URL:', url);
        return;
      }
    }
    
    setLinkDialogOpen(false);
  };
  
  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDialogOpen(false);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleHeaderMediaUpload(e);
  }, []);

  // Add a useEffect to handle messages from preview window
  useEffect(() => {
    // Handle messages from preview window
    const handleMessage = (event: MessageEvent) => {
      // When preview window signals that it's ready, send the data
      if (event.data && event.data.type === 'preview-window-ready' && previewWindowRef.current) {
        try {
          // Send the complete article data immediately
          const completeData = {
            ...formData,
            content: editor?.getHTML() || formData.content,
            lastUpdated: new Date().toISOString()
          };
          
          previewWindowRef.current.postMessage({
            type: 'article-update-direct',
            articleData: completeData,
            timestamp: new Date().getTime()
          }, '*');
        } catch (e) {
          console.error('Error sending data to preview window:', e);
        }
      }
      
      // Handle request for full content
      if (event.data && event.data.type === 'request-full-content' && previewWindowRef.current) {
        try {
          // Send the complete article data with all content
          const completeData = {
            ...formData,
            content: editor?.getHTML() || formData.content,
            lastUpdated: new Date().toISOString(),
            isLoading: false // Clear loading state
          };
          
          previewWindowRef.current.postMessage({
            type: 'article-update-direct',
            articleData: completeData,
            timestamp: new Date().getTime()
          }, '*');
          
          console.log('Sent full content to preview window in response to request');
        } catch (e) {
          console.error('Error sending full content to preview window:', e);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('message', handleMessage);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [formData, editor]);

  // Open full article preview in a new tab
  const openFullArticlePreview = () => {
    try {
      // Prepare the preview data
      const previewData = {
        ...formData,
        content: editor?.getHTML() || formData.content,
        lastUpdated: new Date().toISOString()
      };
      
      // First, clear any existing data to avoid storage issues
      sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
      
      // Store minimal initial data in sessionStorage
      const initialData = {
        title: previewData.title || 'Untitled Article',
        author: previewData.author,
        category: previewData.category,
        tags: previewData.tags,
        publicationDate: previewData.publicationDate,
        headerMedia: previewData.headerMedia,
        lastUpdated: previewData.lastUpdated,
        // Only store a loading indicator in storage
        content: '<p>Loading content...</p>',
        isLoading: true
      };
      
      // Ensure the data is stored before opening the window
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(initialData));
      
      // Open a new tab with the preview
      const previewWindow = window.open('/article-preview', '_blank');
      
      // Store the reference
      if (previewWindow) {
        previewWindowRef.current = previewWindow;
        
        // Send complete data via postMessage once the window is loaded
        const messageInterval = setInterval(() => {
          // Check if window is still open
          if (previewWindowRef.current && !previewWindowRef.current.closed) {
            try {
              // Send the full content directly via postMessage
              previewWindowRef.current.postMessage({
                type: 'article-update-direct',
                articleData: previewData,
                timestamp: new Date().getTime()
              }, '*');
            } catch (e) {
              console.log('Preview window communication error', e);
              clearInterval(messageInterval);
            }
          } else {
            // Window was closed, clear interval
            clearInterval(messageInterval);
          }
        }, 500); // Send updates every 500ms to ensure connection
        
        // Clear interval after 10 seconds to avoid resource waste
        setTimeout(() => {
          clearInterval(messageInterval);
        }, 10000);
      }
    } catch (error) {
      console.error('Error opening preview:', error);
      setError('Could not open preview. The article may be too large.');
    }
  };

  // Toggle full article preview - keep for compatibility but redirect to new tab version
  const toggleFullArticlePreview = () => {
    openFullArticlePreview();
  };

  // Toggle preview mode within the editor
  const togglePreviewMode = () => {
    setPreviewMode(prev => !prev);
  };

  if (loading && !editor) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render the full article preview
  if (fullArticlePreview) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-8 bg-white shadow-lg rounded-lg">
        {/* Navigation Back from Preview */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={toggleFullArticlePreview}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Editor
          </button>
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            Preview Mode
          </span>
        </div>

        {/* Article Header */}
        {formData.headerMedia && (
          <div className="mb-6">
            {formData.headerMedia.type === 'image' ? (
              <img 
                src={formData.headerMedia.url} 
                alt={formData.title} 
                className="w-full h-80 object-cover rounded-lg"
              />
            ) : (
              <video 
                src={formData.headerMedia.url} 
                controls 
                className="w-full h-80 object-cover rounded-lg"
              />
            )}
          </div>
        )}

        {/* Article Title */}
        <h1 className="text-4xl font-bold mb-4">{formData.title || "Untitled Article"}</h1>

        {/* Article Metadata */}
        <div className="flex flex-wrap items-center text-gray-600 mb-6 gap-4">
          {formData.author && (
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                {formData.author.charAt(0).toUpperCase()}
              </div>
              <span>{formData.author}</span>
            </div>
          )}

          {formData.publicationDate && (
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>{format(new Date(formData.publicationDate), 'MMMM d, yyyy')}</span>
            </div>
          )}

          {formData.category && (
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {categories.find(c => c.value === formData.category)?.label || formData.category}
            </div>
          )}
        </div>

        {/* Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {formData.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Article Content */}
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: editor?.getHTML() || formData.content }}
        />
        
        {/* Article Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-gray-600 italic">
            This article {formData.published ? 'was' : 'will be'} published on {format(new Date(formData.publicationDate || new Date()), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {articleId ? 'Edit Article' : 'Create New Article'}
        </h1>
        <button
          onClick={() => navigate('/admin/articles')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Articles
        </button>
      </div>

      {/* Link Dialog */}
      <LinkDialog
        isOpen={linkDialogOpen}
        initialUrl={currentLinkUrl}
        onClose={() => setLinkDialogOpen(false)}
        onSave={handleSaveLink}
        onRemove={currentLinkUrl ? handleRemoveLink : undefined}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Header Media Upload Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Header Media
        </label>
        <div 
          ref={headerDropAreaRef}
          className={`border-2 border-dashed rounded-lg p-6 relative transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {formData.headerMedia ? (
            <div className="relative">
              <button 
                onClick={removeHeaderMedia}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10"
                title="Remove media"
              >
                <Trash2 size={16} />
              </button>
              
              {formData.headerMedia.type === 'image' ? (
                <img 
                  src={formData.headerMedia.url} 
                  alt="Header" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <video 
                  src={formData.headerMedia.url} 
                  controls 
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              
              <p className="mt-2 text-sm text-gray-600">
                {formData.headerMedia.fileName || 'Header media'}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-900">Drag and drop your header media</p>
                <p className="text-xs text-gray-500">PNG, JPG, MP4, WebM up to 10MB</p>
              </div>
              <button
                onClick={() => headerMediaInputRef.current?.click()}
                className="mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Select file
              </button>
              <input
                type="file"
                ref={headerMediaInputRef}
                onChange={handleHeaderMediaUpload}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The header media will be displayed on the article card and at the top of the article.
        </p>
      </div>

      {/* Article Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Article title"
          />
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Author name"
          />
        </div>

        <div>
          <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar size={16} className="inline mr-1" /> Publication Date
          </label>
          <input
            type="date"
            id="publicationDate"
            name="publicationDate"
            value={formData.publicationDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tags Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Tag size={16} className="inline mr-1" /> Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map(tag => (
            <span 
              key={tag} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button 
                onClick={() => removeTag(tag)} 
                className="ml-1.5 text-blue-500 hover:text-blue-700"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a tag"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Editor Toolbar */}
      {!previewMode && editor && (
        <div className="border border-gray-300 rounded-t-lg p-2 flex flex-wrap gap-1 bg-gray-50 mb-1">
          {/* Text Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Underline"
          >
            <UnderlineIcon size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Align Right"
          >
            <AlignRight size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Media */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded hover:bg-gray-100"
            title="Insert Image"
          >
            <ImageIcon size={18} />
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </button>
          <button
            onClick={setLink}
            className={`p-2 rounded ${editor.isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Insert Link"
          >
            <LinkIcon size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          {/* Highlight */}
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            title="Highlight"
          >
            <Highlighter size={18} />
          </button>
        </div>
      )}

      {/* Editor / Preview Area */}
      <div className="mb-6">
        <div className="flex justify-end mb-2">
          <div className="flex gap-2">
            <button
              onClick={togglePreviewMode}
              className={`flex items-center px-3 py-1 rounded ${previewMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
              title="Toggle between edit and preview mode"
            >
              <Eye size={16} className="mr-1" /> {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            <button
              onClick={openFullArticlePreview}
              className="flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors relative group"
              title="Opens preview in a new tab with live updates"
            >
              <Monitor size={16} className="mr-1" /> Full Article Preview
              <span className="absolute top-full right-0 mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                Opens in a new tab and updates as you edit
              </span>
            </button>
          </div>
        </div>
        
        {previewMode ? (
          <div 
            key={`preview-${lastEditorUpdate}`}
            className="border border-gray-300 rounded-lg p-6 min-h-[400px] prose max-w-none"
            dangerouslySetInnerHTML={{ __html: editor?.getHTML() || formData.content }}
          />
        ) : (
          <EditorContent 
            editor={editor} 
            className="border border-gray-300 rounded-lg min-h-[400px] overflow-y-auto prose max-w-none p-1.5"
          />
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Uploading {mediaType === 'image' ? 'image' : 'video'}...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-end">
        <button
          onClick={() => handleSave(false)}
          disabled={loading}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save size={16} className="inline mr-1" /> {articleId ? 'Update as Draft' : 'Save as Draft'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {articleId ? 'Update & Publish' : 'Publish'}
        </button>
      </div>
    </div>
  );
}; 