import React, { useState } from 'react';
import { User, Edit2, Trash2 } from 'lucide-react';
import { Spinner } from './Spinner';

interface CommentProps {
  comment: any;
  currentUserId: string | undefined;
  onEdit: (comment: any, newContent: string) => void;
  onDelete: (commentId: string) => void;
  isDeleting: boolean;
}

export function Comment({ comment, currentUserId, onEdit, onDelete, isDeleting }: CommentProps) {
  const isAuthor = currentUserId === comment.userId;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleEdit = () => {
    onEdit(comment, editContent);
    setIsEditing(false);
  };

  return (
    <div className="flex space-x-4 py-6 group">
      <div className="flex-shrink-0">
        {comment.photoURL ? (
          <img
            src={comment.photoURL}
            alt={comment.userName}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{comment.userName}</h4>
            <p className="text-xs text-gray-500">
              {comment.createdAt?.toDate().toLocaleString()}
            </p>
          </div>
          {isAuthor && (
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                disabled={isDeleting}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
        <div className="mt-2">
          {isEditing ? (
            <div className="flex space-x-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 flex-grow"
              />
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white rounded-lg px-4 py-2"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>
      </div>
    </div>
  );
} 