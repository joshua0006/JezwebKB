import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function RichTextEditor({ value, onChange, placeholder, error }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  // Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  // Only render ReactQuill on the client-side to avoid SSR issues
  if (!mounted) {
    return (
      <div 
        className={`w-full px-3 py-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-lg min-h-[300px]`}
      />
    );
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        theme="snow"
        className={error ? 'quill-error' : ''}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      <style jsx>{`
        .rich-text-editor {
          margin-bottom: 2rem;
        }
        
        .quill-error .ql-toolbar.ql-snow,
        .quill-error .ql-container.ql-snow {
          border-color: #ef4444;
        }
        
        :global(.ql-editor) {
          min-height: 200px;
          font-size: 16px;
        }
 