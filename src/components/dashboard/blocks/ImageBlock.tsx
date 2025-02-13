import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageBlockProps {
  value: string;
  onChange: (content: string) => void;
}

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

function ImagePreview({ file, onRemove }: ImagePreviewProps) {
  const [preview, setPreview] = useState<string>('');

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
      <img
        src={preview}
        alt="Upload preview"
        className="w-full h-full object-contain"
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
      >
        <X className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

export function ImageBlock({ value, onChange }: ImageBlockProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Upload to storage bucket and get URL
      // For now, we'll just store the file object
      onChange(file.name); // This will be replaced with the actual URL later
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Upload to storage bucket and get URL
      onChange(file.name); // This will be replaced with the actual URL later
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      
      {!selectedFile && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
      
      {selectedFile && (
        <ImagePreview
          file={selectedFile}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}