import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Tutorial } from '../../types';
import { tutorials } from '../../data/tutorials';

interface TutorialAssignmentProps {
  assignedTutorials?: string[];
  onAssign: (tutorialIds: string[]) => void;
}

export function TutorialAssignment({ assignedTutorials = [], onAssign }: TutorialAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutorials, setSelectedTutorials] = useState<string[]>(assignedTutorials);

  const filteredTutorials = tutorials.filter(
    (tutorial) =>
      (tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedTutorials.includes(tutorial.id)
  );

  const handleToggleTutorial = (tutorialId: string) => {
    const newSelection = selectedTutorials.includes(tutorialId)
      ? selectedTutorials.filter(id => id !== tutorialId)
      : [...selectedTutorials, tutorialId];
    
    setSelectedTutorials(newSelection);
    onAssign(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tutorials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Selected Tutorials */}
      {selectedTutorials.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Assigned Tutorials</h4>
          <div className="bg-gray-50 rounded-md p-3 space-y-2">
            {selectedTutorials.map(tutorialId => {
              const tutorial = tutorials.find(t => t.id === tutorialId);
              if (!tutorial) return null;
              return (
                <div
                  key={tutorial.id}
                  className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm"
                >
                  <span className="text-sm text-gray-900">{tutorial.title}</span>
                  <button
                    onClick={() => handleToggleTutorial(tutorial.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tutorials */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Available Tutorials</h4>
        <div className="bg-gray-50 rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
              onClick={() => handleToggleTutorial(tutorial.id)}
            >
              <div>
                <h5 className="text-sm font-medium text-gray-900">{tutorial.title}</h5>
                <p className="text-xs text-gray-500">{tutorial.description}</p>
              </div>
              <button
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Assign
              </button>
            </div>
          ))}
          {filteredTutorials.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              No tutorials found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}