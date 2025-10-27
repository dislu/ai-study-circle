'use client';

import { useState } from 'react';
import { Download, FileText, File, Image, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    type: 'summary' | 'exam';
    title: string;
    data: any;
  };
}

export default function ExportModal({ isOpen, onClose, content }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | 'png'>('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    metadata: true,
    timestamps: true,
    branding: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Portable Document Format' },
    { value: 'docx', label: 'Word Document', icon: File, description: 'Microsoft Word format' },
    { value: 'txt', label: 'Text File', icon: FileText, description: 'Plain text format' },
    { value: 'png', label: 'Image', icon: Image, description: 'PNG image format' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      const exportData = {
        format: exportFormat,
        content: content.data,
        options: includeOptions,
        title: content.title,
        type: content.type
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${content.title}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setExportStatus('success');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('Export failed:', errorData.error || 'Unknown error');
        throw new Error(errorData.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return isExporting ? <Clock className="h-6 w-6 text-blue-600 animate-pulse" /> : null;
    }
  };

  const getStatusMessage = () => {
    switch (exportStatus) {
      case 'success':
        return 'Export completed successfully!';
      case 'error':
        return 'Export failed. Please try again.';
      default:
        return isExporting ? 'Exporting your content...' : null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Export {content.type === 'summary' ? 'Summary' : 'Exam'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Content Info */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Content to export:</p>
            <p className="font-medium text-gray-900">{content.title}</p>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <label key={format.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format.value}
                      checked={exportFormat === format.value}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{format.label}</p>
                      <p className="text-xs text-gray-500">{format.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Include Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.metadata}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, metadata: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Document metadata</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.timestamps}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, timestamps: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Creation timestamps</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.branding}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, branding: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">AI Study Circle branding</span>
              </label>
            </div>
          </div>

          {/* Status Message */}
          {(isExporting || exportStatus !== 'idle') && (
            <div className="mb-6 p-3 rounded-lg bg-gray-50 flex items-center space-x-3">
              {getStatusIcon()}
              <span className="text-sm text-gray-700">{getStatusMessage()}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 btn btn-outline"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportStatus === 'success'}
              className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>
                {isExporting ? 'Exporting...' : exportStatus === 'success' ? 'Exported!' : 'Export'}
              </span>
            </button>
          </div>

          {/* Format-specific notes */}
          <div className="mt-4 text-xs text-gray-500">
            {exportFormat === 'pdf' && (
              <p>• PDF exports include formatting and are suitable for printing</p>
            )}
            {exportFormat === 'docx' && (
              <p>• Word documents can be further edited in Microsoft Word</p>
            )}
            {exportFormat === 'txt' && (
              <p>• Text files contain only the content without formatting</p>
            )}
            {exportFormat === 'png' && (
              <p>• Images are great for sharing on social media or presentations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}