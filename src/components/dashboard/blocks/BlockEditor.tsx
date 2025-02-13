import React, { useState } from 'react';
import { Plus, GripVertical, Trash2, Heading, Type, Image, Video, Donut as Button, Minus, FlipVertical as ArrowsVertical, Palette } from 'lucide-react';
import { TutorialBlock } from '../../../types';
import { TextBlock } from './TextBlock';
import { HeadingBlock } from './HeadingBlock';
import { ImageBlock } from './ImageBlock';
import { VideoBlock } from './VideoBlock';
import { ButtonBlock } from './ButtonBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';
import { IconBlock } from './IconBlock';

interface BlockEditorProps {
  blocks: TutorialBlock[];
  onChange: (blocks: TutorialBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const addBlock = (type: TutorialBlock['type'], position: 'top' | 'bottom') => {
    const newBlock: TutorialBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      order: position === 'top' ? -1 : blocks.length,
    };
    const newBlocks = position === 'top' 
      ? [newBlock, ...blocks]
      : [...blocks, newBlock];
    
    // Reorder all blocks
    onChange(newBlocks.map((block, index) => ({ ...block, order: index })));
  };

  const updateBlock = (id: string, content: string) => {
    onChange(
      blocks.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    onChange(newBlocks.map((block, index) => ({ ...block, order: index })));
  };

  const renderBlock = (block: TutorialBlock, index: number) => {
    const blockProps = {
      value: block.content,
      onChange: (content: string) => updateBlock(block.id, content),
      onRemove: () => removeBlock(block.id),
    };

    return (
      <div
        key={block.id}
        className={`group relative flex items-start gap-4 bg-white rounded-lg p-4 border ${
          draggedBlockId === block.id 
            ? 'opacity-50 border-gray-200' 
            : 'border-gray-200 hover:border-gray-300 relative transition-transform'
        } transition-colors`}
        draggable={false}
        onDragStart={(e) => {
          setDraggedBlockId(block.id);
          e.dataTransfer.setData('text/plain', index.toString());
        }}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const position = e.clientY < midY ? 'before' : 'after';
          
          setDropPosition(position);
          if (dragOverBlockId !== block.id) {
            setDragOverBlockId(block.id);
          }
        }}
        onDragLeave={() => {
          if (dragOverBlockId === block.id) {
            setDragOverBlockId(null);
            setDropPosition(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          const toIndex = dropPosition === 'after' ? index + 1 : index;
          moveBlock(fromIndex, toIndex);
          setDraggedBlockId(null);
          setDragOverBlockId(null);
          setDropPosition(null);
        }}
        onDragEnd={() => {
          setDraggedBlockId(null);
          setDragOverBlockId(null);
          setDropPosition(null);
        }}
      >
        {/* Drop indicator line */}
        {dragOverBlockId === block.id && dropPosition && (
          <div
            className={`absolute left-0 right-0 h-0.5 bg-indigo-500 transform ${
              dropPosition === 'before' ? '-translate-y-6' : 'translate-y-[52px]'
            }`}
          />
        )}

        <div className="flex flex-col items-center">
          <button
            className="cursor-grab text-gray-400 hover:text-gray-600"
            draggable
            onMouseDown={(e) => {
              const target = e.currentTarget.parentElement?.parentElement;
              if (target) {
                target.draggable = true;
                // Store the original draggable state of child elements
                const draggableElements = target.querySelectorAll('[draggable]');
                draggableElements.forEach(el => {
                  if (el !== e.currentTarget) {
                    (el as HTMLElement).draggable = false;
                  }
                });
              }
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget.parentElement?.parentElement;
              if (target) {
                target.draggable = false;
                // Restore the original draggable state
                const draggableElements = target.querySelectorAll('[draggable]');
                draggableElements.forEach(el => {
                  if (el !== e.currentTarget) {
                    (el as HTMLElement).draggable = true;
                  }
                });
              }
            }}
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="h-8" /> {/* Spacer between icons */}
          <button
            onClick={() => removeBlock(block.id)}
            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove block"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1">
          {block.type === 'text' && <TextBlock {...blockProps} />}
          {block.type === 'heading' && <HeadingBlock {...blockProps} />}
          {block.type === 'image' && <ImageBlock {...blockProps} />}
          {block.type === 'video' && <VideoBlock {...blockProps} />}
          {block.type === 'button' && <ButtonBlock {...blockProps} />}
          {block.type === 'divider' && <DividerBlock {...blockProps} />}
          {block.type === 'spacer' && <SpacerBlock {...blockProps} />}
          {block.type === 'icon' && <IconBlock {...blockProps} />}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Top block buttons */}
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg max-w-[1200px] mx-auto mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock('heading', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Heading"
          >
            <Heading className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('text', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Text"
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('image', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Image"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('video', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Video"
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('button', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Button"
          >
            <Button className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('divider', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Divider"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('spacer', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Spacer"
          >
            <ArrowsVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('icon', 'top')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Icon"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6 [&>*:has(+.absolute)]:translate-y-6 [&>.absolute]:translate-y-6">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>

      {/* Bottom block buttons */}
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg max-w-[1200px] mx-auto mt-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock('heading', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Heading"
          >
            <Heading className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('text', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Text"
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('image', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Image"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('video', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Video"
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('button', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Button"
          >
            <Button className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('divider', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Divider"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('spacer', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Spacer"
          >
            <ArrowsVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addBlock('icon', 'bottom')}
            className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Add Icon"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}