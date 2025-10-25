'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import TextInput from '@/components/TextInput';
import ContentPreview from '@/components/ContentPreview';
import SummaryGenerator from '@/components/SummaryGenerator';
import ExamGenerator from '@/components/ExamGenerator';
import JobStatus from '@/components/JobStatus';
import Header from '@/components/Header';
import { FileText, BookOpen, ClipboardCheck, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'summary' | 'exam'>('upload');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<string[]>([]);

  const handleJobCreated = (jobId: string, type: string) => {
    setCurrentJobId(jobId);
    setActiveJobs(prev => [...prev, jobId]);
    
    // Auto-switch to appropriate tab after content upload
    if (type === 'file_upload' || type === 'text_input') {
      // Stay on upload tab until processing is complete
    }
  };

  const handleJobCompleted = (jobId: string, result: any) => {
    if (result?.text) {
      setContentData(result);
    }
    setActiveJobs(prev => prev.filter(id => id !== jobId));
  };

  const handleContentReady = () => {
    // Switch to summary tab when content is ready
    setActiveTab('summary');
  };

  const tabs = [
    {
      id: 'upload',
      label: 'Upload Content',
      icon: FileText,
      description: 'Upload files or enter text'
    },
    {
      id: 'summary',
      label: 'Generate Summary',
      icon: BookOpen,
      description: 'AI-powered summaries'
    },
    {
      id: 'exam',
      label: 'Create Exam',
      icon: ClipboardCheck,
      description: 'Automated question generation'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900">
              AI Study Circle
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your content into intelligent summaries and comprehensive exam papers 
            using advanced AI technology.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <nav className="flex space-x-4 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.id !== 'upload' && !contentData;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id as any)}
                  disabled={isDisabled}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-600 text-white shadow-md' 
                      : isDisabled 
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isDisabled ? 'opacity-50' : ''}`} />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Jobs Status */}
        {activeJobs.length > 0 && (
          <div className="mb-8">
            <JobStatus 
              jobIds={activeJobs}
              onJobCompleted={handleJobCompleted}
              onContentReady={handleContentReady}
            />
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {/* Content Upload Section */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="card">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-primary-600" />
                    Upload File
                  </h2>
                  <FileUpload onJobCreated={handleJobCreated} />
                </div>

                <div className="card">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <BookOpen className="h-6 w-6 mr-2 text-primary-600" />
                    Enter Text
                  </h2>
                  <TextInput onJobCreated={handleJobCreated} />
                </div>
              </div>

              {/* Content Preview */}
              {contentData && (
                <div className="card">
                  <ContentPreview content={contentData} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && contentData && (
            <div className="card">
              <SummaryGenerator 
                contentJobId={currentJobId}
                contentText={contentData.text}
                onJobCreated={handleJobCreated}
              />
            </div>
          )}

          {activeTab === 'exam' && contentData && (
            <div className="card">
              <ExamGenerator 
                contentJobId={currentJobId}
                contentText={contentData.text}
                onJobCreated={handleJobCreated}
              />
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Summaries</h3>
            <p className="text-gray-600">
              Generate intelligent summaries with customizable length and style for any audience.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Exam Generation</h3>
            <p className="text-gray-600">
              Create comprehensive exams with various question types and difficulty levels automatically.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Leverage advanced AI technology to analyze content and generate educational materials.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}