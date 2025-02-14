import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bookmark, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { getTutorialById, getTutorialsByCategory } from '../data/tutorials';
import { userService } from '../services/userService';
import { Link } from 'react-router-dom';
import { tutorialService } from '../services/tutorialService';
import { arrayRemove, doc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export function Dashboard() {
  const { userProfile, setUserProfile } = useAuth();
  const [localUserProfile, setLocalUserProfile] = useState(userProfile);
  const [tutorialsByCategory, setTutorialsByCategory] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const refreshData = async () => {
      if (userProfile) {
        const profile = await userService.getUserProfile(userProfile.uid);
        setLocalUserProfile(profile);
      }
    };
    refreshData();
  }, []);

  useEffect(() => {
    const tutorialsRef = collection(db, 'tutorials');
    const unsubscribe = onSnapshot(tutorialsRef, (snapshot) => {
      const tutorials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const grouped = tutorials.reduce((acc, tutorial) => {
        const category = tutorial.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(tutorial);
        return acc;
      }, {} as Record<string, any[]>);
      setTutorialsByCategory(grouped);
    });
    return unsubscribe;
  }, []);

  const handleRemoveTutorial = async (tutorialId: string, type: 'read' | 'favorite') => {
    if (!user) return;

    try {
      if (type === 'read') {
        await tutorialService.unmarkTutorialAsRead(user.uid, tutorialId);
        setLocalUserProfile(prev => prev ? {
          ...prev,
          readTutorials: prev.readTutorials.filter(id => id !== tutorialId)
        } : null);
      } else {
        await tutorialService.toggleFavorite(user.uid, tutorialId, false);
        setLocalUserProfile(prev => prev ? {
          ...prev,
          favorites: prev.favorites.filter(id => id !== tutorialId)
        } : null);
      }
    } catch (error) {
      console.error('Error removing tutorial:', error);
    }
  };

  const calculateCategoryProgress = (category: string) => {
    const allTutorials = tutorialsByCategory[category] || [];
    const completedTutorials = localUserProfile?.readTutorials?.filter(tutorialId => {
      return allTutorials.some(t => t.id === tutorialId);
    }) || [];

    const total = allTutorials.length;
    const completed = completedTutorials.length;
    
    return {
      category,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
              Tutorial Progress
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['WordPress', 'Elementor', 'Gravity Forms', 'Shopify'].map((category) => {
                const progress = calculateCategoryProgress(category);
                
                return (
                  <div key={category} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900">{category} Tutorials</h3>
                      <span className="text-sm text-gray-500">{progress.percentage}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      {progress.completed} of {progress.total} tutorials completed
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                to="/tutorials" 
                className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center justify-center"
              >
                Explore More Tutorials
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Progress Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Learning Progress
            </h2>
            <div className="space-y-4">
              {localUserProfile?.readTutorials?.map((tutorialId) => {
                const tutorial = getTutorialById(tutorialId);
                return (
                  <div key={tutorialId} className="hover:cursor-pointer mb-1 p-1">
                  <Link 
                        to={`/tutorials/${tutorialId}`}
                        className="hover:text-indigo-600 transition-colors "
                      >
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:text-indigo-600 hover:bg-gray-100 hover:cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3 hover:text-indigo-600 transition-colors ">
                      
                        <h3 className="font-medium text-gray-900">{tutorial?.title}</h3>
                      
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  </Link>
                  </div>
                );
              })}
              {localUserProfile?.readTutorials?.length === 0 && (
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
              {localUserProfile?.favorites?.map((tutorialId) => {
                const tutorial = getTutorialById(tutorialId);
                return (
                  <div key={tutorialId} className="hover:cursor-pointer mb-1 p-1">
                    <Link 
                      to={`/tutorials/${tutorialId}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:text-indigo-600 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{tutorial?.title}</h3>
                        </div>
                        <Bookmark className="h-5 w-5 text-yellow-500" />
                      </div>
                    </Link>
                  </div>
                );
              })}
              {localUserProfile?.favorites?.length === 0 && (
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