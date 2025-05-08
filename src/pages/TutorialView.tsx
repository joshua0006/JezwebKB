import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTutorialById } from '../data/tutorials';
import { 
  Clock, 
  BookOpen, 
  Tag, 
  ArrowLeft, 
  Folder,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tutorialService } from '../services/tutorialService';
import { commentService } from '../services/commentService';
import { Spinner } from '../components/Spinner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Comment } from '../components/Comment';
import { useGoogleRealtimeLoader } from '@google/generative-ai/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TutorialContent } from '../components/TutorialContent';
import ScrollToTopLink from '../components/ScrollToTopLink';
import { format } from 'date-fns';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Tutorial type definition
interface Tutorial {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  items?: TutorialItem[];
  level: 'beginner' | 'intermediate' | 'advanced';
  image?: string;
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

interface TutorialItem {
  id: string;
  title: string;
  completed: boolean;
}

// Article type definition
interface Article {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tutorialId?: string;
  orderInTutorial?: number;
  createdBy: string;
}

// Type guard for Firestore Timestamp
const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

// Utility function to safely decode HTML content before displaying
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

export function TutorialView() {
  const { tutorialId } = useParams<{ tutorialId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, updateProfile } = useAuth();
  const [isRead, setIsRead] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRead, setLoadingRead] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [videoSummary, setVideoSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');

  useEffect(() => {
    const loadProgress = async () => {
      if (tutorialId && user) {
        const progress = await tutorialService.getTutorialProgress(
          user.uid,
          tutorialId
        );
        setIsRead(progress.isRead);
        setIsFavorite(progress.isFavorite);
        setLoading(false);
      }
    };

    // Subscribe to comments
    let unsubscribe: () => void;
    if (tutorialId) {
      unsubscribe = commentService.subscribeToComments(tutorialId, (newComments) => {
        setComments(newComments);
      });
    }

    loadProgress();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tutorialId, user]);

  useEffect(() => {
    const generateSummary = async () => {
      if (!tutorial?.videoUrl) return;
      
      try {
        setIsGeneratingSummary(true);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Summarize this video tutorial in 3-5 bullet points: ${tutorial.videoUrl}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        setVideoSummary(response.text());
      } catch (error) {
        console.error('Error generating summary:', error);
        setVideoSummary('Summary unavailable');
      } finally {
        setIsGeneratingSummary(false);
      }
    };

    generateSummary();
  }, [tutorial?.videoUrl]);

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!tutorialId) return;

      setLoading(true);
      try {
        const tutorialRef = doc(db, 'tutorials', tutorialId);
        const tutorialSnap = await getDoc(tutorialRef);

        if (tutorialSnap.exists()) {
          const tutorialData = {
            id: tutorialSnap.id,
            ...tutorialSnap.data()
          } as Tutorial;
          
          setTutorial(tutorialData);
          
          // Process content for display
          if (tutorialData.content) {
            try {
              // Decode and sanitize content
              const decodedContent = decodeHtmlEntities(tutorialData.content);
              const sanitizedContent = sanitizeHtml(decodedContent);
              
              // Fix any empty paragraphs that might have been created
              const cleanedContent = sanitizedContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
              
              setProcessedContent(cleanedContent);
            } catch (contentError) {
              console.error('Error processing tutorial content:', contentError);
              setProcessedContent(tutorialData.content);
            }
          }
          
          // Fetch related articles
          const articlesRef = collection(db, 'articles');
          const articlesQuery = query(
            articlesRef, 
            where('tutorialId', '==', tutorialId),
            where('published', '==', true),
            orderBy('orderInTutorial', 'asc')
          );
          const querySnapshot = await getDocs(articlesQuery);
          
          const articleData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Article[];
          
          setRelatedArticles(articleData);
        } else {
          setError('Tutorial not found');
        }
      } catch (err) {
        console.error('Error fetching tutorial:', err);
        setError('Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [tutorialId]);

  const handleToggleRead = async () => {
    if (!user || !tutorialId) return;

    setLoadingRead(true);
    try {
      if (isRead) {
        await tutorialService.unmarkTutorialAsRead(user.uid, tutorialId);
        const updatedRead = userProfile?.readTutorials.filter(id => id !== tutorialId) || [];
        updateProfile({ readTutorials: updatedRead });
      } else {
        await tutorialService.markTutorialAsRead(user.uid, tutorialId);
        const updatedRead = [...(userProfile?.readTutorials || []), tutorialId];
        updateProfile({ readTutorials: updatedRead });
      }
      setIsRead(!isRead);
    } catch (error) {
      console.error('Error toggling read status:', error);
    } finally {
      setLoadingRead(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !tutorialId) return;

    setLoadingFavorite(true);
    try {
      await tutorialService.toggleFavorite(user.uid, tutorialId, !isFavorite);
      const newFavorites = isFavorite 
        ? userProfile?.favorites.filter(id => id !== tutorialId) || []
        : [...(userProfile?.favorites || []), tutorialId];
      updateProfile({ favorites: newFavorites });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !tutorialId || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await commentService.addComment(
        tutorialId,
        user.uid,
        userProfile?.username || 'Anonymous',
        newComment,
        userProfile?.photoURL || null
      );
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: any, newContent: string) => {
    if (!comment.id || !newContent.trim()) return;

    // Call the edit comment service
    commentService.editComment(comment.id, newContent)
      .then(() => {
        // Update the local comments state
        setComments(comments.map(c => 
          c.id === comment.id ? { ...c, content: newContent } : c
        ));
      })
      .catch(error => {
        console.error('Error updating comment:', error);
      });
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(commentToDelete);
    try {
      await commentService.deleteComment(commentToDelete);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeletingComment(null);
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Tutorial...</h1>
        </div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Tutorial not found'}</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = tutorial.updatedAt 
    ? format(
        isFirestoreTimestamp(tutorial.updatedAt) 
          ? tutorial.updatedAt.toDate() 
          : new Date(tutorial.updatedAt as unknown as string), 
        'MMMM d, yyyy'
      )
    : 'Unknown date';

  // Get level badge color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
        {/* Featured Image */}
        {tutorial.image && (
          <div className="w-full h-60 md:h-80 overflow-hidden">
            <img 
              src={tutorial.image} 
              alt={tutorial.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Tutorial Header */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(tutorial.level)}`}>
                {tutorial.level.charAt(0).toUpperCase() + tutorial.level.slice(1)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Updated on {formattedDate}
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {tutorial.title}
          </h1>
          
          {tutorial.description && (
            <p className="text-lg text-gray-600 mb-6">
              {tutorial.description}
            </p>
          )}
          
          {/* Tags */}
          {tutorial.tags && tutorial.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {tutorial.tags.map(tag => (
                <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Tutorial Content */}
        <div className="p-6 md:p-8 border-t border-gray-100">
          {processedContent ? (
            <TutorialContent content={processedContent} />
          ) : (
            <p className="text-gray-500 italic">No content available</p>
          )}
        </div>
      </article>
      
      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tutorial Articles</h2>
          <div className="space-y-4">
            {relatedArticles.map((article, index) => (
              <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center mr-4">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      <Link to={`/article/${article.id}`} className="hover:text-indigo-600">
                        {article.title}
                      </Link>
                    </h3>
                    {article.description && (
                      <p className="text-gray-600 mb-2">
                        {article.description}
                      </p>
                    )}
                    <Link
                      to={`/article/${article.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Read Article →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}