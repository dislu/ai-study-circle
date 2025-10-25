'use client';

import { useState } from 'react';
import { uploadText } from '@/lib/api';
import { Type, AlertCircle, CheckCircle } from 'lucide-react';

interface TextInputProps {
  onJobCreated: (jobId: string, type: string) => void;
}

export default function TextInput({ onJobCreated }: TextInputProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text content');
      return;
    }

    if (text.trim().length < 100) {
      setError('Text content should be at least 100 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadText(text, title || 'Direct Text Input');
      
      if (result.success) {
        setSuccess('Text processed successfully!');
        onJobCreated(result.jobId, 'text_input');
        setText('');
        setTitle('');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Processing failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="label">
            Title (Optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your content..."
            className="input"
            disabled={loading}
          />
        </div>

        {/* Text Area */}
        <div>
          <label htmlFor="content" className="label">
            Content
          </label>
          <textarea
            id="content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your content here..."
            className="input min-h-[200px] resize-y"
            disabled={loading}
            required
          />
          
          {/* Character/Word Count */}
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>
              {wordCount} words, {charCount} characters
            </span>
            <span className={charCount < 100 ? 'text-red-500' : 'text-green-600'}>
              {charCount < 100 ? `Need ${100 - charCount} more characters` : '✓ Sufficient content'}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !text.trim() || charCount < 100}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="spinner h-4 w-4 mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Type className="h-4 w-4 mr-2" />
              Process Text
            </>
          )}
        </button>
      </form>

      {/* Success Message */}
      {success && (
        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Content Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Minimum 100 characters (about 20 words)</li>
          <li>• Maximum 1MB of text content</li>
          <li>• Educational content works best</li>
          <li>• Clear structure improves AI analysis</li>
        </ul>
      </div>
    </div>
  );
}