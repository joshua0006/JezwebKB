import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTutorialById } from '../data/tutorials';
import { Breadcrumbs } from '../components/Breadcrumbs';
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

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function TutorialView() {
  const { tutorialId } = useParams();
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
  const tutorial = tutorialId ? getTutorialById(tutorialId) : null;

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

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutorial Not Found</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: tutorial.category.charAt(0).toUpperCase() + tutorial.category.slice(1),
      path: `/categories/${tutorial.category}`
    },
    { label: tutorial.title }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Video Section */}
        {tutorial?.videoUrl ? (
          <div className="mb-8">
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={tutorial.videoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-indigo-800">Video Summary</h3>
                {isGeneratingSummary && <Spinner className="w-5 h-5 text-indigo-600" />}
              </div>
              {videoSummary && (
                <div 
                  className="prose prose-indigo"
                  dangerouslySetInnerHTML={{ __html: videoSummary.replace(/\n/g, '<br/>') }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <img
              src={tutorial?.image}
              alt={tutorial?.title}
              className="w-full h-auto rounded-xl shadow-lg"
            />
          </div>
        )}

        {/* Main Content */}
        <article className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          {tutorial.description && (
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {tutorial.description}
            </p>
          )}

          <div className="prose prose-lg max-w-none 
            prose-headings:text-gray-900
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-ul:list-disc prose-ul:pl-6
            prose-li:marker:text-indigo-600
            prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
            ">
            {tutorial.blocks.map((block, index) => (
              <div 
                key={block.id} 
                className={index !== 0 ? 'mt-8' : ''}
                dangerouslySetInnerHTML={{ __html: block.content }} 
              />
            ))}
          </div>
        </article>

        {/* Progress and Favorites Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleToggleRead}
            disabled={loadingRead}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              isRead 
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            } ${loadingRead ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loadingRead ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {loadingRead 
              ? 'Processing...' 
              : isRead ? 'Completed (Click to undo)' : 'Mark as Complete'}
          </button>

          <button
            onClick={handleToggleFavorite}
            disabled={loadingFavorite}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              isFavorite
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            } ${loadingFavorite ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loadingFavorite ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
            {loadingFavorite 
              ? 'Processing...' 
              : isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments</h2>
          {user ? (
            <div className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add a comment..."
                disabled={isSubmitting}
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 mb-8">Please sign in to leave a comment.</p>
          )}
          
          <div className="divide-y divide-gray-200">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                currentUserId={user?.uid}
                onEdit={handleEditComment}
                onDelete={handleDeleteClick}
                isDeleting={isDeletingComment === comment.id}
              />
            ))}
          </div>

          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Comment"
            message="Are you sure you want to delete this comment? This action cannot be undone."
          />
        </div>

        {/* Navigation Footer */}
        <footer className="flex flex-col sm:flex-row gap-4 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Previous Tutorial
          </button>
          <button
            onClick={() => navigate(`/categories/${tutorial.category}`)}
            className="flex items-center justify-center gap-2 px-6 py-3 text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Folder className="h-5 w-5" />
            More {tutorial.category} Tutorials
          </button>
        </footer>
      </div>
    </div>
  );
}