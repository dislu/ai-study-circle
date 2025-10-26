'use client';

import { useState } from 'react';
import { Search, Plus, FileText, BookOpen, Download, Share2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ExportModal from '@/components/ExportModal';

interface Summary {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: string;
  tags: string[];
  wordCount: number;
}

interface Exam {
  id: string;
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: number;
  createdAt: string;
  completed?: boolean;
  score?: number;
}

export default function MyContentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState<{type: 'summary' | 'exam', data: any} | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Mock data
  const summaries: Summary[] = [
    {
      id: '1',
      title: 'Introduction to Machine Learning',
      content: 'Machine learning is a subset of artificial intelligence that focuses on developing algorithms and statistical models that enable computers to improve their performance on a specific task through experience.',
      subject: 'Computer Science',
      createdAt: '2024-01-15',
      tags: ['AI', 'ML', 'Algorithms'],
      wordCount: 1250
    },
    {
      id: '2',
      title: 'History of World War II',
      content: 'World War II was a global conflict that lasted from 1939 to 1945, involving most of the world\'s nations.',
      subject: 'History',
      createdAt: '2024-01-14',
      tags: ['WWII', 'History'],
      wordCount: 2100
    }
  ];

  const exams: Exam[] = [
    {
      id: '3',
      title: 'Basic Chemistry Quiz',
      questions: [
        {
          question: 'What is the chemical symbol for water?',
          options: ['H2O', 'CO2', 'NaCl', 'CH4'],
          correctAnswer: 'H2O'
        }
      ],
      subject: 'Chemistry',
      difficulty: 'Easy',
      duration: 15,
      createdAt: '2024-01-13',
      completed: true,
      score: 85
    }
  ];

  const allContent = [
    ...summaries.map(s => ({ ...s, type: 'summary' as const })),
    ...exams.map(e => ({ ...e, type: 'exam' as const }))
  ];

  const filteredContent = allContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleExport = (type: 'summary' | 'exam', data: any) => {
    setSelectedItem({ type, data });
    setIsExportModalOpen(true);
  };

  const handleShare = async (title: string, content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: content.substring(0, 200) + '...',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${title}\n\n${content}`);
      alert('Content copied to clipboard!');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Content</h1>
            <p className="text-gray-600">Manage your summaries and exams with advanced export features</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Summaries</p>
                  <p className="text-2xl font-bold text-gray-900">{summaries.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Exams</p>
                  <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <Download className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Export Ready</p>
                  <p className="text-2xl font-bold text-gray-900">{allContent.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Content</option>
              <option value="summary">Summaries</option>
              <option value="exam">Exams</option>
            </select>

            <button className="btn btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create New</span>
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredContent.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    {item.type === 'summary' ? (
                      <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-green-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleExport(item.type, item)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Export"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleShare(item.title, item.type === 'summary' ? (item as Summary).content : `${(item as Exam).questions.length} question exam`)}
                      className="text-gray-400 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                      title="Share"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="mb-4">
                  {item.type === 'summary' ? (
                    <>
                      <p className="text-gray-700 text-sm line-clamp-3 mb-2">
                        {(item as Summary).content}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{(item as Summary).wordCount} words</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{(item as Exam).questions.length} questions</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (item as Exam).difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          (item as Exam).difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(item as Exam).difficulty}
                        </span>
                      </div>
                      {(item as Exam).completed && (item as Exam).score !== undefined && (
                        <div className="text-sm text-gray-600">
                          Score: <span className="font-semibold text-green-600">{(item as Exam).score}%</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Tags for summaries */}
                {item.type === 'summary' && (item as Summary).tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(item as Summary).tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {(item as Summary).tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{(item as Summary).tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button className="btn btn-outline btn-sm flex-1">
                    {item.type === 'summary' ? 'View Summary' : 'Take Exam'}
                  </button>
                  <button
                    onClick={() => handleExport(item.type, item)}
                    className="btn btn-primary btn-sm flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or create new content.</p>
              <button className="btn btn-primary flex items-center space-x-2 mx-auto">
                <Plus className="h-4 w-4" />
                <span>Create Your First Content</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {selectedItem && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => {
            setIsExportModalOpen(false);
            setSelectedItem(null);
          }}
          content={{
            type: selectedItem.type,
            title: selectedItem.data.title,
            data: selectedItem.data
          }}
        />
      )}
    </ProtectedRoute>
  );
}