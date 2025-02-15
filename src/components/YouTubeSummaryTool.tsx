import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Spinner } from './Spinner';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function YouTubeSummaryTool() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidYoutubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return pattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidYoutubeUrl(videoUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Summarize this YouTube video in bullet points. Focus on key topics, main arguments, and conclusions. Video URL: ${videoUrl}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      setSummary(response.text());
    } catch (err) {
      setError('Error generating summary. Please try again.');
      console.error('Summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">YouTube Video Summarizer</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Enter YouTube video URL"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Summarize'}
          </button>
        </div>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </form>

      {loading && (
        <div className="text-center p-6">
          <Spinner className="w-8 h-8 text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-600">Analyzing video content...</p>
        </div>
      )}

      {summary && (
        <div className="prose prose-lg max-w-none bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Video Summary</h2>
          <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }} />
          <p className="mt-4 text-sm text-gray-500">
            Note: This AI-generated summary is based on available video information and may not capture all content.
          </p>
        </div>
      )}
    </div>
  );
} 