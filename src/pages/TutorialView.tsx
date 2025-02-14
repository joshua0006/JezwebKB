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
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tutorialService } from '../services/tutorialService';
import { commentService } from '../services/commentService';
import { Spinner } from '../components/Spinner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Comment } from '../components/Comment';

export function TutorialView() {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isRead, setIsRead] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const tutorial = tutorialId ? getTutorialById(tutorialId) : null;

  useEffect(() => {
    const loadProgress = async () => {
      if (tutorialId) {
        const progress = await tutorialService.getTutorialProgress(userProfile, tutorialId);
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
  }, [tutorialId, userProfile]);

  const handleMarkAsRead = async () => {
    if (!user || !tutorialId) return;

    try {
      await tutorialService.markTutorialAsRead(user.uid, tutorialId);
      setIsRead(true);
    } catch (error) {
      console.error('Error marking tutorial as read:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !tutorialId) return;

    try {
      await tutorialService.toggleFavorite(user.uid, tutorialId, !isFavorite);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
        <Breadcrumbs items={breadcrumbItems} className="mb-8" />
        
        {/* Hero Section */}
        <header className="relative mb-8 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-slate-800/10" />
          <img 
            src={tutorial.image} 
            alt={tutorial.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
            <h1 className="text-4xl font-bold mb-4 drop-shadow-md">
              {tutorial.title}
            </h1>
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Clock className="h-4 w-4 mr-2" />
                <span>10 min read</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Tag className="h-4 w-4 mr-2" />
                <span>{tutorial.category}</span>
              </div>
              {tutorial.tags.map(tag => (
                <span 
                  key={tag}
                  className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Tutorial Progress Controls */}
        {user && !loading && (
          <div className="flex justify-end space-x-4 mb-6">
            <button
              onClick={handleMarkAsRead}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                isRead 
                  ? 'text-green-700 bg-green-50 hover:bg-green-100' 
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {isRead ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <span>{isRead ? 'Completed' : 'Mark as Complete'}</span>
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                isFavorite 
                  ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100' 
                  : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {isFavorite ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
              <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
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