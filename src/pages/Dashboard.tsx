import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bookmark, CheckCircle, Clock } from 'lucide-react';
import { getTutorialById } from '../data/tutorials';

export function Dashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Progress Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Learning Progress
            </h2>
            <div className="space-y-4">
              {userProfile?.readTutorials?.map((tutorialId) => {
                const tutorial = getTutorialById(tutorialId);
                return (
                  <div key={tutorialId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{tutorial?.title}</h3>
                      <p className="text-sm text-gray-500">{tutorial?.category}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                );
              })}
              {userProfile?.readTutorials?.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No completed tutorials yet
                </div>
              )}
            </div>
          </div>

          {/* Favorites Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Bookmark className="h-6 w-6 text-yellow-600 mr-2" />
              Favorite Tutorials
            </h2>
            <div className="space-y-4">
              {userProfile?.favorites?.map((tutorialId) => {
                const tutorial = getTutorialById(tutorialId);
                return (
                  <div key={tutorialId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{tutorial?.title}</h3>
                      <p className="text-sm text-gray-500">{tutorial?.category}</p>
                    </div>
                    <Bookmark className="h-5 w-5 text-yellow-500" />
                  </div>
                );
              })}
              {userProfile?.favorites?.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No favorite tutorials yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}