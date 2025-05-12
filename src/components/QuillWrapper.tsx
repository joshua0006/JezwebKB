import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';

// Define interface for additional methods we want to expose
export interface QuillWrapperHandle {
  getEditor: () => Quill;
  getHTML: () => string;
  setHTML: (html: string) => void;
  focus: () => void;
  reactQuillRef: React.RefObject<ReactQuill>;
}

const QuillWrapper = forwardRef<QuillWrapperHandle, Omit<ReactQuillProps, 'ref'>>((props, ref) => {
  const quillRef = useRef<ReactQuill>(null);
  
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
    },
    reactQuillRef: quillRef
  }), [quillRef.current]);

  return <ReactQuill ref={quillRef} {...props} />;
});

QuillWrapper.displayName = 'QuillWrapper';

export default QuillWrapper; 