import { useEffect, useRef } from 'react';
import { processFirebaseContent } from '../utils/firebaseUtils';
import { ErrorBoundary } from './ErrorBoundary';

interface HeaderMedia {
  url: string;
  type: 'image' | 'video';
  caption?: string;
  fileName?: string;
}

interface ArticleContentProps {
  content: string;
  headerMedia?: HeaderMedia | null;
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

    // Process image containers
    const mediaContainers = contentRef.current.querySelectorAll('figure[data-type="image-container"], figure[data-type="video-container"]');
    mediaContainers.forEach(container => {
      // Make sure container has proper styling
      container.classList.add('media-container');
      
      // Check alignment
      if (!container.classList.contains('align-left') && 
          !container.classList.contains('align-center') && 
          !container.classList.contains('align-right')) {
        container.classList.add('align-center'); // Default alignment
      }
      
      // Process images
      const img = container.querySelector('img');
      if (img) {
        img.classList.add('quill-image');
        if (!img.classList.contains('size-small') && 
            !img.classList.contains('size-medium') && 
            !img.classList.contains('size-large') && 
            !img.classList.contains('size-full')) {
          img.classList.add('size-medium'); // Default size
        }
        
        // Add error handling for images
        img.onerror = () => {
          img.src = '/images/jezweb.webp'; // Fallback image
          img.classList.add('image-error');
        };
      }
      
      // Process videos
      const video = container.querySelector('video');
      if (video) {
        video.classList.add('quill-video');
        if (!video.classList.contains('size-small') && 
            !video.classList.contains('size-medium') && 
            !video.classList.contains('size-large') && 
            !video.classList.contains('size-full')) {
          video.classList.add('size-medium'); // Default size
        }
        
        // Add controls if missing
        if (!video.hasAttribute('controls')) {
          video.setAttribute('controls', 'true');
        }
        
        // Add playsInline attribute for mobile compatibility
        if (!video.hasAttribute('playsInline')) {
          video.setAttribute('playsInline', 'true');
        }
        
        // Add load event handler for success
        if (!video.onloadeddata) {
          video.onloadeddata = () => {
            video.classList.add('video-loaded');
          };
        }
        
        // Add preload attribute for better performance
        if (!video.hasAttribute('preload')) {
          video.setAttribute('preload', 'metadata');
        }
        
        // Add error handling for videos
        video.onerror = () => {
          const parent = video.parentElement;
          if (parent) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'video-error bg-gray-100 text-gray-500 p-4 rounded-lg flex items-center justify-center';
            errorMsg.innerHTML = `
              <div class="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p>Video unavailable</p>
              </div>
            `;
            video.replaceWith(errorMsg);
          }
        };
        
        // If video has no sources, create fallback content
        const sources = video.querySelectorAll('source');
        if (sources.length === 0 && video.src) {
          // Get original src
          const videoSrc = video.src;
          
          // Remove src from video element to force using source elements
          video.removeAttribute('src');
          
          // Append source elements for common formats
          const formats = ['video/mp4', 'video/webm', 'video/ogg'];
          formats.forEach(format => {
            const source = document.createElement('source');
            source.src = videoSrc;
            source.type = format;
            video.appendChild(source);
          });
          
          // Add fallback content
          const fallback = document.createElement('div');
          fallback.innerHTML = `
            <p>Your browser doesn't support HTML5 video. Here is a 
              <a href="${videoSrc}" target="_blank" rel="noopener noreferrer">link to the video</a> instead.
            </p>
          `;
          video.appendChild(fallback);
        }
      }
      
      // Process captions
      const caption = container.querySelector('figcaption');
      if (caption) {
        caption.classList.add('media-caption');
      }
    });

    // Handle iframe videos (YouTube, Vimeo, etc.)
    const iframes = contentRef.current.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const parent = iframe.parentElement;
      
      // Check if already wrapped in our custom wrapper
      if (parent?.classList.contains('iframe-wrapper')) return;
      
      // Check if it's a ql-video class (Quill editor inserts iframes with this class)
      if (iframe.classList.contains('ql-video')) {
        // Remove any explicit width/height attributes that might conflict with responsive design
        iframe.removeAttribute('width');
        iframe.removeAttribute('height');
        
        // Create responsive wrapper with proper aspect ratio
        const wrapper = document.createElement('div');
        wrapper.className = 'iframe-wrapper relative pb-[56.25%] h-0 overflow-hidden max-w-full mb-6 rounded-lg';
        
        // Insert wrapper before the iframe
        if (parent) {
          parent.insertBefore(wrapper, iframe);
          
          // Add the iframe to the wrapper with proper styling
          iframe.className = 'absolute top-0 left-0 w-full h-full border-0 rounded-lg';
          wrapper.appendChild(iframe);
          
          // If iframe is inside a <p> tag with only this content, add extra styling
          if (parent.tagName === 'P' && parent.childNodes.length === 1) {
            parent.classList.add('iframe-container-paragraph');
            parent.style.margin = '0';
          }
        }
      } else {
        // For other iframes, still make them responsive
        const wrapper = document.createElement('div');
        wrapper.className = 'iframe-wrapper relative pb-[56.25%] h-0 overflow-hidden max-w-full mb-6 rounded-lg';
        
        // Insert wrapper before the iframe
        if (parent) {
          parent.insertBefore(wrapper, iframe);
          
          // Add the iframe to the wrapper with proper styling
          iframe.className = 'absolute top-0 left-0 w-full h-full border-0';
          wrapper.appendChild(iframe);
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

// Header Media Component
const HeaderMediaRenderer = ({ headerMedia }: { headerMedia: HeaderMedia }) => {
  return (
    <div className="header-media-container mb-8 overflow-hidden rounded-lg shadow-lg">
      {headerMedia.type === 'image' ? (
        <figure className="relative">
          <img 
            src={headerMedia.url} 
            alt={headerMedia.caption || 'Article header image'} 
            className="w-full h-auto max-h-[600px] object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/images/jezweb.webp'; // Fallback image
              target.classList.add('image-error');
            }}
          />
          {headerMedia.caption && (
            <figcaption className="media-caption p-2 bg-gray-50 text-sm text-gray-600 italic">
              {headerMedia.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <figure className="relative">
          <video 
            src={headerMedia.url}
            className="w-full h-auto max-h-[600px] object-cover"
            controls
            playsInline
            preload="metadata"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              const parent = target.parentElement;
              if (parent) {
                const errorMsg = document.createElement('div');
                errorMsg.className = "video-error bg-gray-100 text-gray-500 p-4 rounded-lg flex items-center justify-center h-64";
                errorMsg.innerHTML = `
                  <div class="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p>Video unavailable</p>
                  </div>
                `;
                target.replaceWith(errorMsg);
              }
            }}
          ></video>
          {headerMedia.caption && (
            <figcaption className="media-caption p-2 bg-gray-50 text-sm text-gray-600 italic">
              {headerMedia.caption}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
};

// This component provides enhanced handling of rich text content from the editor
export const ArticleContent = ({ content, headerMedia }: ArticleContentProps) => {
  // Use Firebase utility to process content safely
  const processedContent = processFirebaseContent(typeof content === 'string' ? content : '');

  // Add custom styles for media content
  useEffect(() => {
    // Add custom styles for media if not already present
    if (!document.getElementById('article-content-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'article-content-styles';
      styleSheet.textContent = `
        .article-content-wrapper .media-container {
          margin: 1.5rem 0;
          max-width: 100%;
        }
        
        .article-content-wrapper .media-container.align-left {
          text-align: left;
        }
        
        .article-content-wrapper .media-container.align-center {
          text-align: center;
          margin-left: auto;
          margin-right: auto;
        }
        
        .article-content-wrapper .media-container.align-right {
          text-align: right;
          margin-left: auto;
        }
        
        .article-content-wrapper .quill-image,
        .article-content-wrapper .quill-video {
          border-radius: 0.375rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          height: auto;
        }
        
        .article-content-wrapper .quill-video {
          max-width: 100%;
          display: block;
          opacity: 0.8;
          transition: opacity 0.3s ease-in-out;
        }
        
        .article-content-wrapper .quill-video.video-loaded {
          opacity: 1;
        }
        
        /* Hide fallback content inside video when video is supported */
        .article-content-wrapper .quill-video > *:not(source) {
          display: none;
        }
        
        /* Show fallback content when video is not supported */
        .article-content-wrapper video:not([controls]) > *:not(source) {
          display: block;
        }
        
        .article-content-wrapper .quill-image.size-small,
        .article-content-wrapper .quill-video.size-small {
          max-width: 25%;
        }
        
        .article-content-wrapper .quill-image.size-medium,
        .article-content-wrapper .quill-video.size-medium {
          max-width: 50%;
        }
        
        .article-content-wrapper .quill-image.size-large,
        .article-content-wrapper .quill-video.size-large {
          max-width: 75%;
        }
        
        .article-content-wrapper .quill-image.size-full,
        .article-content-wrapper .quill-video.size-full {
          width: 100%;
        }
        
        .article-content-wrapper .media-caption {
          font-style: italic;
          color: #6b7280;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
        
        .article-content-wrapper .quill-image.image-error {
          border: 1px dashed #e5e7eb;
          background-color: #f3f4f6;
        }
        
        .article-content-wrapper .video-error {
          width: 100%;
          aspect-ratio: 16/9;
          margin: 0 auto;
        }
        
        .article-content-wrapper .iframe-wrapper {
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        
        .article-content-wrapper .iframe-container-paragraph {
          margin: 1.5rem 0;
        }
        
        .article-content-wrapper iframe.ql-video {
          display: block;
        }

        /* Header Media styles */
        .header-media-container {
          width: 100%;
          position: relative;
        }

        .header-media-container img, 
        .header-media-container video {
          width: 100%;
          display: block;
        }

        .header-media-container .media-caption {
          padding: 0.5rem 1rem;
          background-color: rgba(249, 250, 251, 0.9);
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        @media (max-width: 640px) {
          .article-content-wrapper .quill-image.size-small,
          .article-content-wrapper .quill-video.size-small,
          .article-content-wrapper .quill-image.size-medium,
          .article-content-wrapper .quill-video.size-medium,
          .article-content-wrapper .quill-image.size-large,
          .article-content-wrapper .quill-video.size-large {
            max-width: 100%;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

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
      {headerMedia && <HeaderMediaRenderer headerMedia={headerMedia} />}
      <ContentRenderer content={processedContent} />
    </ErrorBoundary>
  );
}; 