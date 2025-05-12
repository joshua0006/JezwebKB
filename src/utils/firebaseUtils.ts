import { Timestamp } from 'firebase/firestore';

/**
 * Type guard to check if a value is a Firestore Timestamp
 */
export const isFirestoreTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === 'function';
};

/**
 * Safely convert a Firestore timestamp to a JavaScript Date
 */
export const timestampToDate = (timestamp: unknown): Date => {
  if (isFirestoreTimestamp(timestamp)) {
    return timestamp.toDate();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  return new Date(); // Return current date as fallback
};

/**
 * Safely decode HTML entities
 */
export const decodeHtmlEntities = (html: string): string => {
  if (!html) return '';
  
  try {
    // Create a textarea element to safely decode HTML entities
    const textArea = document.createElement('textarea');
    textArea.innerHTML = html;
    const decodedContent = textArea.value;
    textArea.remove();
    return decodedContent;
  } catch (error) {
    console.error('Error decoding HTML entities:', error);
    return html;
  }
};

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  try {
    // Create a safe parser environment using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove dangerous scripts
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove dangerous attributes but keep data attributes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove event handlers
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        // Remove javascript URLs
        if (attr.name === 'href' && attr.value.toLowerCase().includes('javascript:')) {
          el.setAttribute(attr.name, '#');
        }
      });
    });
    
    // Keep only secure iframes (e.g., YouTube, Vimeo)
    const iframes = doc.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      const allowedDomains = [
        'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 
        'player.vimeo.com', 'vimeo.com',
        'dailymotion.com', 'www.dailymotion.com',
        'codepen.io', 'www.codepen.io',
        'jsfiddle.net', 'www.jsfiddle.net',
        'firebasestorage.googleapis.com' // Allow Firebase Storage videos
      ];
      
      let isAllowed = false;
      for (const domain of allowedDomains) {
        if (src.includes(domain)) {
          isAllowed = true;
          break;
        }
      }
      
      if (!isAllowed && src !== '') {
        iframe.setAttribute('src', '');
        iframe.classList.add('unsafe-iframe');
      }
    });
    
    // Extract the sanitized content
    return doc.body.innerHTML;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    
    // Basic sanitization as fallback
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
};

/**
 * Process content from Firebase for safe display
 * Combines decoding and sanitization while preserving media elements
 */
export const processFirebaseContent = (content: string): string => {
  if (!content) return '';
  
  try {
    // First decode any HTML entities
    const decodedContent = decodeHtmlEntities(content);
    
    // Then sanitize the content
    const sanitizedContent = sanitizeHtml(decodedContent);
    
    // Fix any empty paragraphs that might have been created
    const fixedContent = sanitizedContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
    
    // Create a temporary element to process media elements
    const tempEl = document.createElement('div');
    tempEl.innerHTML = fixedContent;
    
    // Process media containers to ensure proper attributes
    const mediaContainers = tempEl.querySelectorAll('figure');
    mediaContainers.forEach(container => {
      // Preserve data attributes if they exist
      if (!container.getAttribute('data-type')) {
        // Try to guess the type based on child elements
        if (container.querySelector('img')) {
          container.setAttribute('data-type', 'image-container');
        } else if (container.querySelector('video')) {
          container.setAttribute('data-type', 'video-container');
        }
      }
    });
    
    // Process iframes specifically for Quill editor's output
    const iframes = tempEl.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      // Make sure ql-video class is preserved if it's from Quill
      if (!iframe.classList.contains('ql-video') && 
          (iframe.src?.includes('youtube.com') || 
           iframe.src?.includes('vimeo.com') || 
           iframe.src?.includes('firebasestorage.googleapis.com'))) {
        iframe.classList.add('ql-video');
      }
      
      // Check if iframe is in a proper container
      const parent = iframe.parentElement;
      if (parent && parent.tagName === 'P') {
        // If iframe is directly in a <p> tag, make sure it has appropriate styling
        // This will be transformed with proper responsive wrapper in the component
        parent.style.textAlign = 'center';
        parent.style.margin = '1.5rem 0';
      }
    });
    
    return tempEl.innerHTML;
  } catch (error) {
    console.error('Error processing Firebase content:', error);
    return content;
  }
}; 