import { useParams, useNavigate } from 'react-router-dom';
import { getTutorialById } from '../data/tutorials';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Clock, BookOpen, Tag } from 'lucide-react';

export function TutorialView() {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const tutorial = tutorialId ? getTutorialById(tutorialId) : null;

  if (!tutorial) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutorial Not Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: tutorial.category.charAt(0).toUpperCase() + tutorial.category.slice(1),
      path: `/categories/${tutorial.category}`
    },
    {
      label: tutorial.title.charAt(0).toUpperCase() + tutorial.title.slice(1)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto  ">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Header Section */}
        <header className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {tutorial.title.charAt(0).toUpperCase() + tutorial.title.slice(1)}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>10 min read</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              <span>Tutorial</span>
            </div>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              <span className="text-indigo-600">
                {tutorial.category.charAt(0).toUpperCase() + tutorial.category.slice(1)}
              </span>
            </div>
          </div>

          {tutorial.description && (
            <p className="text-gray-600 text-lg">
              {tutorial.description}
            </p>
          )}
        </header>

        {/* Main Content */}
        <article className="bg-white rounded-xl shadow-sm p-8">
          <div className="prose prose-lg prose-indigo max-w-none">
            {tutorial.blocks.map((block, index) => (
              <div 
                key={block.id} 
                className={index !== 0 ? 'mt-8' : ''}
                dangerouslySetInnerHTML={{ __html: block.content }} 
              />
            ))}
          </div>
        </article>

        {/* Navigation Footer */}
        <footer className="mt-8 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Previous
          </button>
          <button
            onClick={() => navigate(`/categories/${tutorial.category}`)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            More in {tutorial.category.charAt(0).toUpperCase() + tutorial.category.slice(1)}
          </button>
        </footer>
      </div>
    </div>
  );
} 