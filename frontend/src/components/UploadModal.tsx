import React from 'react';
import { Upload, BookOpen, ClipboardCheck, X } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadType, setUploadType] = React.useState<'summary' | 'exam' | 'both'>('both');
  const [isUploading, setIsUploading] = React.useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    // Mock upload process
    setTimeout(() => {
      setIsUploading(false);
      setFile(null);
      onClose();
      // Show success message
      alert('File uploaded successfully!');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, TXT up to 10MB
                </p>
              </label>
            </div>
          </div>

          {/* Upload Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What would you like to generate?
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="summary"
                  checked={uploadType === 'summary'}
                  onChange={(e) => setUploadType(e.target.value as 'summary')}
                  className="text-blue-600"
                />
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Summary only</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="exam"
                  checked={uploadType === 'exam'}
                  onChange={(e) => setUploadType(e.target.value as 'exam')}
                  className="text-purple-600"
                />
                <ClipboardCheck className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">Exam questions only</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="both"
                  checked={uploadType === 'both'}
                  onChange={(e) => setUploadType(e.target.value as 'both')}
                  className="text-green-600"
                />
                <div className="flex space-x-1">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Both summary and exam</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}