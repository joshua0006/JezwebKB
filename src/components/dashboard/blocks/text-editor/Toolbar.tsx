import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, Quote, Code,
  Undo, Redo, Link as LinkIcon, Unlink, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, Palette,
  Highlighter
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';
import { ColorPicker } from './ColorPicker';

interface ToolbarProps {
  editor: Editor | null;
}

const TEXT_COLORS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000', '#008000'];
const HIGHLIGHT_COLORS = ['#FFFF00', '#00FF00', '#FF69B4', '#87CEEB', '#DDA0DD'];

export function Toolbar({ editor }: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = React.useState(false);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().toggleLink({ href: url }).run();
    }
  };

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Bold"
        icon={Bold}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="Italic"
        icon={Italic}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        title="Code"
        icon={Code}
      />

      <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
        icon={List}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
        icon={ListOrdered}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
        icon={Quote}
      />

      <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        title="Add Link"
        icon={LinkIcon}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        title="Remove Link"
        icon={Unlink}
      />

      <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
        icon={AlignLeft}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
        icon={AlignCenter}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
        icon={AlignRight}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
        icon={AlignJustify}
      />

      <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

      <div className="relative">
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          isActive={showColorPicker}
          title="Text Color"
          icon={Palette}
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 min-w-[200px]">
            <ColorPicker
              colors={TEXT_COLORS}
              onSelect={(color) => {
                editor.chain().focus().setColor(color).run();
                setShowColorPicker(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          isActive={showHighlightPicker}
          title="Highlight Color"
          icon={Highlighter}
        />
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 min-w-[200px]">
            <ColorPicker
              colors={HIGHLIGHT_COLORS}
              onSelect={(color) => {
                editor.chain().focus().toggleHighlight({ color }).run();
                setShowHighlightPicker(false);
              }}
              onRemove={() => {
                editor.chain().focus().unsetHighlight().run();
                setShowHighlightPicker(false);
              }}
              showRemove
            />
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Undo"
        icon={Undo}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Redo"
        icon={Redo}
      />
    </div>
  );
}