import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';

// Define interface for additional methods we want to expose
export interface QuillWrapperHandle {
  getEditor: () => Quill;
  getHTML: () => string;
  setHTML: (html: string) => void;
  focus: () => void;
  ensureSelection: () => void;
}

// Define props interface
export interface QuillWrapperProps {
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

const QuillWrapper = forwardRef<QuillWrapperHandle, QuillWrapperProps>((props, ref) => {
  const quillRef = useRef<ReactQuill>(null);
  
  // Ensure editor is ready and focused when needed
  useEffect(() => {
    const handleFocusEvent = (e: MouseEvent) => {
      if (quillRef.current && e.target && quillRef.current.getEditor().root.contains(e.target as Node)) {
        if (quillRef.current) {
          const editor = quillRef.current.getEditor();
          // If there's no current selection, set it to the end of the document
          if (!editor.getSelection()) {
            const length = editor.getLength();
            editor.setSelection(length - 1, 0);
          }
        }
      }
    };

    // Add focus event listener to the document
    document.addEventListener('click', handleFocusEvent);

    return () => {
      document.removeEventListener('click', handleFocusEvent);
    };
  }, []);
  
  useImperativeHandle(ref, () => ({
    getEditor: () => {
      if (!quillRef.current) {
        throw new Error('Quill instance not available');
      }
      return quillRef.current.getEditor();
    },
    getHTML: () => {
      if (!quillRef.current) {
        return '';
      }
      return quillRef.current.getEditor().root.innerHTML;
    },
    setHTML: (html: string) => {
      if (!quillRef.current) {
        return;
      }
      const editor = quillRef.current.getEditor();
      editor.clipboard.dangerouslyPasteHTML(html);
    },
    focus: () => {
      if (!quillRef.current) {
        return;
      }
      quillRef.current.focus();
      
      // Ensure there's a valid selection after focusing
      const editor = quillRef.current.getEditor();
      if (!editor.getSelection()) {
        const length = editor.getLength();
        editor.setSelection(length - 1, 0);
      }
    },
    ensureSelection: () => {
      if (!quillRef.current) {
        return;
      }
      const editor = quillRef.current.getEditor();
      if (!editor.getSelection()) {
        const length = editor.getLength();
        editor.setSelection(length - 1, 0);
      }
    }
  }), [quillRef.current]);

  return <ReactQuill ref={quillRef} {...props} />;
});

QuillWrapper.displayName = 'QuillWrapper';

export default QuillWrapper; 