import { useParams, useNavigate } from 'react-router-dom';
import { getTutorialsByCategory } from '../data/tutorials'; // Adjust the import based on your data structure
import { Link } from 'react-router-dom';
import { Layout, Box, FileText, ShoppingBag, ChevronRight, Home } from 'lucide-react'; // Import icons
import { format } from 'date-fns';
import { Breadcrumbs } from '../components/Breadcrumbs';
import ScrollToTopLink from '../components/ScrollToTopLink';

export function CategoryView() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const tutorials = getTutorialsByCategory(categoryId || '');
  const categoryName = categoryId 
    ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ')
    : 'Unknown Category';

  const breadcrumbItems = [
    { label: 'Tutorials', path: '/tutorials' },
    { label: categoryName }
  ];

  if (!tutorials.length) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Tutorials Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Define icons for categories
  const categoryIcons = {
    wordpress: <Layout className="h-6 w-6 text-indigo-600" />,
    elementor: <Box className="h-6 w-6 text-indigo-600" />,
    'gravity-forms': <FileText className="h-6 w-6 text-indigo-600" />,
    shopify: <ShoppingBag className="h-6 w-6 text-indigo-600" />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  ">
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tutorials in Category: {categoryName}</h1>
      <div className="grid items-center align-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {tutorials.map(tutorial => (
          <div
            key={tutorial.id}
            className="bg-white w-[360px] mx-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
          >
            {/* Image Section */}
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={tutorial.image || '/default-tutorial-image.jpg'}
                alt={tutorial.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                <ScrollToTopLink to={`/tutorial/${tutorial.id}`} className="hover:text-blue-600">
                  {tutorial.title}
                </ScrollToTopLink>
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 line-clamp-2">
                {tutorial.description}
              </p>

              {/* Time and Read More Button */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {tutorial.updatedAt ? (
                    <>Updated {format(new Date(tutorial.updatedAt), 'MMM d, yyyy')}</>
                  ) : (
                    'Recently updated'
                  )}
                </span>
                <Link
                  to={`/tutorials/${tutorial.id}`}
                  className="flex-shrink-0 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Read More
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-sm text-gray-600">Total Tutorials Available: {tutorials.length}</p>
      </div>
    </div>
  );
}
