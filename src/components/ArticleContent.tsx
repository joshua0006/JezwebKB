import { useEffect, useRef } from 'react';
import { processFirebaseContent } from '../utils/firebaseUtils';
import { ErrorBoundary } from './ErrorBoundary';

interface ArticleContentProps {
  content: string;
}

// Content component that is wrapped by error boundary
const ContentRenderer = ({ content }: { content: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Apply additional processing to content after it's rendered
  useEffect(() => {
    if (!contentRef.current) return;
    
    // Process links to ensure they open in new tabs
    const links = contentRef.current.querySelectorAll('a');
    links.forEach(link => {
      // If link doesn't already have target attribute, add it
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Make font size elements render properly
    const fonts = contentRef.current.querySelectorAll('font');
    fonts.forEach(font => {
      const size = font.getAttribute('size');
      if (size) {
        // Apply appropriate classes based on font size
        switch(size) {
          case '2':
            font.classList.add('text-sm');
            break;
          case '3':
            font.classList.add('text-base');
            break;
          case '4':
            font.classList.add('text-lg');
            break;
          case '5':
            font.classList.add('text-xl');
            break;
        }
      }
    });
    
    // Handle tables for better mobile responsiveness
    const tables = contentRef.current.querySelectorAll('table');
    tables.forEach(table => {
      // Add responsive table wrapper if not already wrapped
      if (table.parentElement?.classList.contains('table-responsive')) return;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive overflow-x-auto';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="article-content-wrapper prose prose-lg prose-indigo max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

// This component provides enhanced handling of rich text content from the editor
export const ArticleContent = ({ content }: ArticleContentProps) => {
  // Use Firebase utility to process content safely
  const processedContent = processFirebaseContent(typeof content === 'string' ? content : '');

  // Custom fallback for content errors
  const contentErrorFallback = (
    <div className="p-4 border border-amber-200 bg-amber-50 rounded">
      <h3 className="font-medium text-amber-800">Content Display Issue</h3>
      <p className="text-amber-700 mt-1">
        There was a problem displaying this content. The article may contain formatting that couldn't be rendered properly.
      </p>
    </div>
  );

  return (
    <ErrorBoundary fallback={contentErrorFallback}>
      <ContentRenderer content={processedContent} />
    </ErrorBoundary>
  );
}; 