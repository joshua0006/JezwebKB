import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Palette, Image as ImageIcon } from 'lucide-react';
import { ColorPicker } from './text-editor/ColorPicker';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { IconPicker } from './IconBlock';
import { iconMap } from '../../../data/icons';

const HEADING_COLORS = [
  '#1F2937', // gray-800
  '#DC2626', // red-600
  '#2563EB', // blue-600
  '#059669', // emerald-600
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
  '#D97706', // amber-600
  '#4F46E5', // indigo-600
];

interface HeadingBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export function HeadingBlock({ value, onChange }: HeadingBlockProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const [selectedIcon, setSelectedIcon] = React.useState('');
  const colorPickerRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(colorPickerRef, () => {
    setShowColorPicker(false);
  });

  React.useEffect(() => {
    try {
      const content = value.trim();
      if (content.startsWith('{"icon":')) {
        const parsed = JSON.parse(content);
        setSelectedIcon(parsed.icon);
      }
    } catch (e) {
      // Not JSON content, ignore
    }
  }, [value]);

  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon);
    const newContent = JSON.stringify({ icon, text: editor?.getHTML() || '' });
    onChange(newContent);
    setShowIconPicker(false);
  };

  const editor = useEditor({
    extensions: [
      TextStyle,
      Color.configure(),
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {      
      if (selectedIcon) {
        const newContent = JSON.stringify({ icon: selectedIcon, text: editor.getHTML() });
        onChange(newContent);
      } else {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-xl focus:outline-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg',
      },
    },
  });

  return (
    <div className="flex flex-col gap-2 max-w-[1200px] mx-auto">
      <div className="flex gap-2 items-center select-none">
        {/* Heading Level Buttons */}
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors ${
            editor?.isActive('heading', { level: 2 })
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'text-gray-700'
          }`}
        >
          H2
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors ${
            editor?.isActive('heading', { level: 3 })
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'text-gray-700'
          }`}
        >
          H3
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
          className={`px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors ${
            editor?.isActive('heading', { level: 4 })
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
              : 'text-gray-700'
          }`}
        >
          H4
        </button>

        {/* Icon Picker */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowIconPicker(!showIconPicker)}
            className={`px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
              showIconPicker ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'text-gray-700'
            }`}
            title="Add Icon"
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          
          {showIconPicker && (
            <IconPicker
              value={selectedIcon}
              onChange={handleIconSelect}
              onClose={() => setShowIconPicker(false)}
            />
          )}
        </div>

        {/* Color Picker */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
              showColorPicker ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'text-gray-700'
            }`}
            title="Text Color"
            type="button"
          >
            <Palette className="h-4 w-4" />
          </button>
          
          {showColorPicker && (
            <div 
              ref={colorPickerRef}
              className="absolute top-full left-0 mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-200 z-50"
            >
              <ColorPicker
                colors={HEADING_COLORS}
                onSelect={(color) => {
                  editor?.chain().focus().setColor(color).run();
                }}
                onRemove={() => {
                  editor?.chain().focus().unsetColor().run();
                }}
                showRemove
              />
            </div>
          )}
        </div>
      </div>

      <div 
        className="min-h-[50px] border border-gray-300 rounded-md p-4 cursor-text focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 prose prose-xl max-w-[1200px] relative"
      >
        {selectedIcon && (
          <div className="absolute -left-10 top-1/2 -translate-y-1/2">
            {(() => {
              const Icon = iconMap[selectedIcon as keyof typeof iconMap];
              return Icon ? <Icon className="h-6 w-6 text-indigo-600" /> : null;
            })()}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}