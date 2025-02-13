import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Toolbar } from './text-editor/Toolbar';

interface TextBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export function TextBlock({ value, onChange }: TextBlockProps) {
  const editor = useEditor({
    extensions: [
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 hover:text-indigo-500',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color.configure(),
      Highlight.configure({
        multicolor: true,
      }),
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 my-4',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 rounded px-1 py-0.5 font-mono text-sm',
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-[200px] p-4 prose-headings:font-bold prose-p:text-gray-700 prose-a:text-indigo-600 hover:prose-a:text-indigo-500',
      },
    },
  });

  // Close color pickers when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.color-picker') && !target.closest('.highlight-picker')) {
        // The toolbar component now handles its own state
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden max-w-[1200px] mx-auto">
      <div className="select-none">
        <Toolbar editor={editor} />
      </div>
      <div className="cursor-text prose-sm sm:prose lg:prose-lg">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}