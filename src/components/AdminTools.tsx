import { useState } from 'react';
import { backfillSlugsForArticles } from '../services/articleService';

export function AdminTools() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string; updatedCount: number }>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackfillSlugs = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    
    try {
      const result = await backfillSlugsForArticles();
      setResult(result);
    } catch (err) {
      console.error('Error backfilling slugs:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Article Slug Management</h2>
        <p className="mb-4 text-gray-600">
          This tool will generate URL-friendly slugs for all articles that don't have one.
          The slugs will be created from the article titles.
        </p>
        
        <button
          onClick={handleBackfillSlugs}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-md font-medium ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Generate Missing Slugs'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
            <p><strong>Success!</strong> {result.message}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 