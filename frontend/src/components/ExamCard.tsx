'use client';

import { useState } from 'react';
import { Download, Share2, Clock, CheckCircle, MoreVertical } from 'lucide-react';
import ExportModal from './ExportModal';

interface ExamCardProps {
  exam: {
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
    duration: number; // in minutes
    createdAt: string;
    completed?: boolean;
    score?: number;
  };
}

export default function ExamCard({ exam }: ExamCardProps) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleExport = () => {
    setIsExportModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    const shareText = `Check out this ${exam.subject} exam: "${exam.title}" - ${exam.questions.length} questions, ${exam.difficulty} difficulty`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: exam.title,
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Exam details copied to clipboard!');
    }
    setIsMenuOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {exam.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <span>{exam.subject}</span>
              <span>•</span>
              <span>{exam.questions.length} questions</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{exam.duration} min</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exam.difficulty)}`}>
                {exam.difficulty}
              </span>
              {exam.completed && (
                <span className="flex items-center space-x-1 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </span>
              )}
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
                  <span>Export Questions</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Exam</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Score Display (if completed) */}
        {exam.completed && exam.score !== undefined && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Score:</span>
              <span className={`text-lg font-semibold ${getScoreColor(exam.score)}`}>
                {exam.score}%
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  exam.score >= 80 ? 'bg-green-500' : 
                  exam.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${exam.score}%` }}
              />
            </div>
          </div>
        )}

        {/* Question Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Sample Question:</p>
          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
            {exam.questions[0]?.question || 'Questions will be loaded when you start the exam.'}
          </p>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-4">
          Created on {new Date(exam.createdAt).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button className="btn btn-primary btn-sm flex-1">
            {exam.completed ? 'Retake Exam' : 'Start Exam'}
          </button>
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
          type: 'exam',
          title: exam.title,
          data: exam
        }}
      />
    </>
  );
}