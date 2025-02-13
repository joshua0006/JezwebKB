import React, { useState } from 'react';

interface VideoBlockProps {
  value: string;
  onChange: (content: string) => void;
}

export function VideoBlock({ value, onChange }: VideoBlockProps) {
  const [error, setError] = useState(false);

  return (
    <div className="space-y-4">
      <input
        type="url"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setError(false);
        }}
        placeholder="Enter YouTube embed URL (e.g., https://www.youtube.com/embed/...)"
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-base"
      />
      {value && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={value}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setError(true)}
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              Invalid video URL
            </div>
          )}
        </div>
      )}
    </div>
  );
}