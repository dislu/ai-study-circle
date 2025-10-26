'use client';

import { useState } from 'react';
import { Download, Share2, Bookmark, MoreVertical } from 'lucide-react';
import ExportModal from './ExportModal';

interface SummaryCardProps {
  summary: {
    id: string;
    title: string;
    content: string;
    subject: string;
    createdAt: string;
    tags: string[];
    wordCount: number;
  };
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExport = () => {
    setIsExportModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: summary.title,
          text: summary.content.substring(0, 200) + '...',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${summary.title}\n\n${summary.content}\n\nCreated with AI Study Circle`
      );
      alert('Summary copied to clipboard!');
    }
    setIsMenuOpen(false);
  };

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark functionality to be implemented');
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {summary.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{summary.subject}</span>
              <span>•</span>
              <span>{summary.wordCount} words</span>
              <span>•</span>
              <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleBookmark}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Bookmark</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm line-clamp-3">
            {summary.content}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {summary.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleShare}
            className="btn btn-outline btn-sm flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        content={{
          type: 'summary',
          title: summary.title,
          data: summary
        }}
      />
    </>
  );
}