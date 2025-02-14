import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tutorialService } from '../services/tutorialService';
import { commentService } from '../services/commentService';

export function Dashboard() {
  const { userProfile } = useAuth();
  const [progress, setProgress] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (userProfile) {
        const readTutorials = userProfile.readTutorials;
        const categories = new Set();

        // Assuming you have a function to get tutorials by IDs
        for (const tutorialId of readTutorials) {
          const tutorial = await tutorialService.getTutorialById(tutorialId);
          if (tutorial) {
            categories.add(tutorial.category);
            setProgress((prev) => ({
              ...prev,
              [tutorial.category]: [...(prev[tutorial.category] || []), tutorial.title]
            }));
          }
        }
      }
      setLoading(false);
    };

    fetchProgress();
  }, [userProfile]);

  const totalTutorials = 10; // Example total tutorials per category
  const progressPercentage = (completed: number) => (completed / totalTutorials) * 100;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Progress</h1>
      {Object.keys(progress).length === 0 ? (
        <p>No progress recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(progress).map(([category, tutorials]) => (
            <div key={category} className="bg-white shadow rounded-lg p-4">
              <h2 className="text-xl font-semibold">{category}</h2>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-full bg-indigo-600 rounded"
                  style={{ width: `${progressPercentage(tutorials.length)}%` }}
                />
              </div>
              <ul className="list-disc pl-5">
                {tutorials.map((title, index) => (
                  <li key={index} className="text-gray-700">{title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}