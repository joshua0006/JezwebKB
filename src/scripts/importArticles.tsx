import React, { useState } from 'react';
import { convertTutorialsToArticles } from './convertTutorialsToArticles';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Check, Loader } from 'lucide-react';

/**
 * Admin component to trigger the tutorial to article conversion
 */
export function ImportArticlesComponent() {
  const { userProfile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  
  const handleImport = async () => {
    if (!userProfile?.uid) {
      setStatus('error');
      setMessage('You must be logged in to run this operation');
      return;
    }
    
    if (userProfile.role !== 'admin') {
      setStatus('error');
      setMessage('Only admin users can import articles');
      return;
    }
    
    try {
      setStatus('loading');
      setMessage('Converting tutorials to articles...');
      
      await convertTutorialsToArticles(userProfile.uid);
      
      setStatus('success');
      setMessage('Tutorials were successfully converted to articles!');
    } catch (error) {
      console.error('Error importing articles:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Import Tutorials as Articles</h2>
        <p className="text-gray-600">
          This tool will convert all tutorials from the data/tutorials directory into articles in the Firebase Firestore database.
          Each block of content will be combined into a single HTML content field.
        </p>
      </div>
      
      {/* Status messages */}
      {status === 'success' && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="w-5 h-5 mr-2 text-green-500" />
          <p>{message}</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
          <p>{message}</p>
        </div>
      )}
      
      {/* Admin-only warning */}
      {userProfile && userProfile.role !== 'admin' && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
          <p>This tool is only available to admin users.</p>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={status === 'loading' || !userProfile || userProfile.role !== 'admin'}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {status === 'loading' ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Articles'
          )}
        </button>
      </div>
    </div>
  );
} 