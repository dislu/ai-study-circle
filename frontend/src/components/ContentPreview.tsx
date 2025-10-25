'use client';

interface ContentPreviewProps {
  content: {
    text: string;
    metadata?: any;
  };
}

export default function ContentPreview({ content }: ContentPreviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Content Preview</h2>
      
      {content.metadata && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Document Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {content.metadata.originalName && (
              <div>
                <span className="text-gray-600">File:</span> {content.metadata.originalName}
              </div>
            )}
            {content.metadata.wordCount && (
              <div>
                <span className="text-gray-600">Words:</span> {content.metadata.wordCount}
              </div>
            )}
            {content.metadata.pageCount && (
              <div>
                <span className="text-gray-600">Pages:</span> {content.metadata.pageCount}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
        <h3 className="font-medium mb-2">Text Content</h3>
        <div className="prose prose-sm max-w-none">
          {content.text.substring(0, 1000)}
          {content.text.length > 1000 && (
            <span className="text-gray-500">... (truncated for preview)</span>
          )}
        </div>
      </div>
    </div>
  );
}