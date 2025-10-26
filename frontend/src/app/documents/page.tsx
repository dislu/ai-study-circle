'use client';

import { useState, useEffect } from 'react';
import { FileText, BookOpen, ClipboardCheck, Download, Trash2, Eye, Calendar, FileIcon, Search, Filter } from 'lucide-react';
import Header from '@/components/Header';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt';
  size: string;
  uploadDate: string;
  status: 'completed' | 'processing' | 'failed';
  summaryGenerated: boolean;
  examGenerated: boolean;
  wordsCount: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  useEffect(() => {
    // Mock documents data
    setDocuments([
      {
        id: '1',
        name: 'Machine Learning Fundamentals.pdf',
        type: 'pdf',
        size: '2.4 MB',
        uploadDate: '2024-01-20',
        status: 'completed',
        summaryGenerated: true,
        examGenerated: true,
        wordsCount: 12450
      },
      {
        id: '2',
        name: 'Python Programming Guide.docx',
        type: 'doc',
        size: '1.8 MB',
        uploadDate: '2024-01-19',
        status: 'completed',
        summaryGenerated: true,
        examGenerated: false,
        wordsCount: 8920
      },
      {
        id: '3',
        name: 'Data Structures Notes.txt',
        type: 'txt',
        size: '456 KB',
        uploadDate: '2024-01-18',
        status: 'processing',
        summaryGenerated: false,
        examGenerated: false,
        wordsCount: 0
      },
      {
        id: '4',
        name: 'Web Development Course.pdf',
        type: 'pdf',
        size: '3.2 MB',
        uploadDate: '2024-01-17',
        status: 'failed',
        summaryGenerated: false,
        examGenerated: false,
        wordsCount: 0
      },
      {
        id: '5',
        name: 'Algorithm Analysis.pdf',
        type: 'pdf',
        size: '1.9 MB',
        uploadDate: '2024-01-16',
        status: 'completed',
        summaryGenerated: true,
        examGenerated: true,
        wordsCount: 9850
      }
    ]);
  }, []);

  const getFileIcon = (type: string) => {
    return <FileIcon className="h-8 w-8 text-blue-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredDocuments = documents
    .filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || doc.status === statusFilter)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return parseFloat(a.size) - parseFloat(b.size);
        case 'date': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        default: return 0;
      }
    });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const handleGenerateSummary = (id: string) => {
    // Mock summary generation
    setDocuments(documents.map(doc => 
      doc.id === id ? {...doc, summaryGenerated: true} : doc
    ));
    alert('Summary generation started!');
  };

  const handleGenerateExam = (id: string) => {
    // Mock exam generation
    setDocuments(documents.map(doc => 
      doc.id === id ? {...doc, examGenerated: true} : doc
    ));
    alert('Exam generation started!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
          <p className="text-gray-600">Manage your uploaded documents and generated content</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid gap-6">
          {filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-6">Upload your first document to get started with AI-powered analysis</p>
              <button className="btn btn-primary">
                Upload Document
              </button>
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <div key={document.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(document.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                        {document.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{document.size}</span>
                        <span>•</span>
                        <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{document.wordsCount > 0 ? `${document.wordsCount.toLocaleString()} words` : 'Processing...'}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {document.status}
                        </div>
                        {document.summaryGenerated && (
                          <div className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                            Summary Ready
                          </div>
                        )}
                        {document.examGenerated && (
                          <div className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                            Exam Ready
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {document.status === 'completed' && (
                      <>
                        {!document.summaryGenerated && (
                          <button
                            onClick={() => handleGenerateSummary(document.id)}
                            className="btn btn-outline btn-sm flex items-center space-x-1"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>Summary</span>
                          </button>
                        )}
                        {!document.examGenerated && (
                          <button
                            onClick={() => handleGenerateExam(document.id)}
                            className="btn btn-outline btn-sm flex items-center space-x-1"
                          >
                            <ClipboardCheck className="h-3 w-3" />
                            <span>Exam</span>
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm">
                          <Eye className="h-3 w-3" />
                        </button>
                        <button className="btn btn-outline btn-sm">
                          <Download className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Generated Content Links */}
                {(document.summaryGenerated || document.examGenerated) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      {document.summaryGenerated && (
                        <a href="#" className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700">
                          <BookOpen className="h-4 w-4" />
                          <span>View Summary</span>
                        </a>
                      )}
                      {document.examGenerated && (
                        <a href="#" className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700">
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Take Exam</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}