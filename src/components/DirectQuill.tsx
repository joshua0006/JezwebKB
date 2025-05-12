import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Define props interface
export interface DirectQuillProps {
  value: string;
  onChange: (value: string) => void;
  onChangeSelection?: (range: any, source: any, editor: any) => void;
  modules?: any;
  formats?: string[];
  placeholder?: string;
  readOnly?: boolean;
  theme?: string;
  className?: string;
}

// Define ref handle interface
export interface DirectQuillHandle {
  getEditor: () => Quill;
  getHTML: () => string;
  setHTML: (html: string) => void;
  focus: () => void;
}

const DirectQuill = forwardRef<DirectQuillHandle, DirectQuillProps>((props, ref) => {
  const {
    value,
    onChange,
    onChangeSelection,
    modules,
    formats,
    placeholder,
    readOnly = false,
    theme = 'snow',
    className = '',
  } = props;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  
  // Setup Quill editor on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    const options = {
      modules: modules || {
        toolbar: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          ['link', 'image'],
          ['clean'],
        ]
      },
      placeholder: placeholder || 'Write something...',
      readOnly,
      theme,
      formats: formats || undefined,
    };
    
    // Initialize Quill with options
    const quill = new Quill(containerRef.current, options);
    quillRef.current = quill;
    
    // Initial content
    if (value) {
      isUpdatingRef.current = true;
      quill.clipboard.dangerouslyPasteHTML(value);
      isUpdatingRef.current = false;
    }
    
    // Listen for changes
    quill.on('text-change', () => {
      if (!isUpdatingRef.current && onChange) {
        onChange(quill.root.innerHTML);
      }
    });
    
    // Listen for selection changes
    if (onChangeSelection) {
      quill.on('selection-change', (range, oldRange, source) => {
        onChangeSelection(range, source, quill);
      });
    }
    
    // Setup MutationObserver to watch for DOM changes instead of relying on deprecated events
    if (containerRef.current && !observerRef.current) {
      observerRef.current = new MutationObserver((mutations) => {
        // This will catch mutations that might have used DOMNodeInserted before
        // We don't need to handle each mutation here as Quill already processes 
        // these changes internally via its text-change event
      });
      
      observerRef.current.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      quillRef.current = null;
    };
  }, []);
  
  // Update content when value prop changes
  useEffect(() => {
    if (!quillRef.current || !value) return;
    
    const editorContent = quillRef.current.root.innerHTML;
    
    // Only update if the value is different from current editor content
    // This prevents cursor jumping when typing
    if (value !== editorContent) {
      isUpdatingRef.current = true;
      quillRef.current.clipboard.dangerouslyPasteHTML(value);
      isUpdatingRef.current = false;
    }
  }, [value]);
  
  // Update readOnly status if it changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getEditor: () => {
      if (!quillRef.current) {
        throw new Error('Quill instance not available');
      }
      return quillRef.current;
    },
    getHTML: () => {
      if (!quillRef.current) {
        return '';
      }
      return quillRef.current.root.innerHTML;
    },
    setHTML: (html: string) => {
      if (!quillRef.current) {
        return;
      }
      isUpdatingRef.current = true;
      quillRef.current.clipboard.dangerouslyPasteHTML(html);
      isUpdatingRef.current = false;
    },
    focus: () => {
      if (!quillRef.current) {
        return;
      }
      quillRef.current.focus();
    }
  }), [quillRef.current]);
  
  return <div ref={containerRef} className={className} />;
});

DirectQuill.displayName = 'DirectQuill';

export default DirectQuill; 