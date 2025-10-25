'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '@/lib/api';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onJobCreated: (jobId: string, type: string) => void;
}

export default function FileUpload({ onJobCreated }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      const result = await uploadFile(file, setUploadProgress);
      
      if (result.success) {
        setSuccess(`File "${result.filename}" uploaded successfully!`);
        onJobCreated(result.jobId, 'file_upload');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onJobCreated]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive && !isDragReject 
            ? 'border-primary-400 bg-primary-50' 
            : isDragReject 
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-3">
          <Upload className={`h-12 w-12 ${
            isDragActive && !isDragReject 
              ? 'text-primary-500' 
              : isDragReject 
                ? 'text-red-500'
                : 'text-gray-400'
          }`} />
          
          {uploading ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading...</p>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
            </div>
          ) : isDragActive ? (
            isDragReject ? (
              <p className="text-red-600">File type not supported</p>
            ) : (
              <p className="text-primary-600">Drop your file here...</p>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PDF, DOCX, TXT, or MD (max 50MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Rejection Messages */}
      {fileRejections.length > 0 && (
        <div className="space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{file.name}: {errors[0]?.message}</span>
            </div>
          ))}
        </div>
      )}

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

      {/* Supported Formats Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Supported Formats</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center">
            <File className="h-4 w-4 mr-1" />
            PDF Documents
          </div>
          <div className="flex items-center">
            <File className="h-4 w-4 mr-1" />
            Word Documents (.docx)
          </div>
          <div className="flex items-center">
            <File className="h-4 w-4 mr-1" />
            Text Files (.txt)
          </div>
          <div className="flex items-center">
            <File className="h-4 w-4 mr-1" />
            Markdown Files (.md)
          </div>
        </div>
      </div>
    </div>
  );
}