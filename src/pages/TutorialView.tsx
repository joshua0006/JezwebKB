import { useParams, useNavigate } from 'react-router-dom';
import { getTutorialById } from '../data/tutorials';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Clock, BookOpen, Tag, ArrowLeft, Folder } from 'lucide-react';

export function TutorialView() {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const tutorial = tutorialId ? getTutorialById(tutorialId) : null;

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