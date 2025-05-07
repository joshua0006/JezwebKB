import { useEffect, useRef } from 'react';

interface ArticleContentProps {
  content: string;
}

// This component provides enhanced handling of rich text content from the editor
export const ArticleContent = ({ content }: ArticleContentProps) => {
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
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="article-content-wrapper prose prose-lg prose-indigo max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}; 