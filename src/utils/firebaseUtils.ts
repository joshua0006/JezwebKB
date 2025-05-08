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
    // Basic sanitization to prevent script execution and XSS
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/<iframe[^>]*>[^<]*<\/iframe>/gi, ''); // Remove iframes
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return html;
  }
};

/**
 * Process content from Firebase for safe display
 * Combines decoding and sanitization
 */
export const processFirebaseContent = (content: string): string => {
  if (!content) return '';
  
  try {
    // First decode any HTML entities
    const decodedContent = decodeHtmlEntities(content);
    
    // Then sanitize the content
    const sanitizedContent = sanitizeHtml(decodedContent);
    
    // Fix any empty paragraphs that might have been created
    return sanitizedContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
  } catch (error) {
    console.error('Error processing Firebase content:', error);
    return content;
  }
}; 