'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import TextInput from '@/components/TextInput';
import ContentPreview from '@/components/ContentPreview';
import SummaryGenerator from '@/components/SummaryGenerator';
import ExamGenerator from '@/components/ExamGenerator';
import JobStatus from '@/components/JobStatus';
import Header from '@/components/Header';
import { FileText, BookOpen, ClipboardCheck, Sparkles, ArrowRight, Users, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
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
      
      {/* Authentication-aware Banner */}
      {!isAuthenticated ? (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="h-12 w-12 mr-3" />
              <h1 className="text-5xl font-bold">AI Study Circle</h1>
            </div>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Transform your documents into intelligent summaries and exam questions with the power of AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth?mode=signup" className="btn btn-lg bg-white text-blue-600 hover:bg-gray-100 flex items-center justify-center">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link href="/features" className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 flex items-center justify-center">
                Learn More
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">10,000+</div>
                <div className="opacity-80">Active Users</div>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">50,000+</div>
                <div className="opacity-80">Documents Processed</div>
              </div>
              <div className="text-center">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">4.9/5</div>
                <div className="opacity-80">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
                <p className="text-lg opacity-90">Ready to create some amazing content today?</p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                <Link href="/dashboard" className="btn bg-white text-blue-600 hover:bg-gray-100 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link href="/documents" className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  My Documents
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tool Section - Only show if authenticated or as demo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary-600 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">
              {isAuthenticated ? 'AI Content Tools' : 'Try Our AI Tools'}
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {isAuthenticated 
              ? 'Create summaries and exams from your content using our AI-powered tools.'
              : 'Experience the power of AI content generation. Sign up to save your work and access advanced features.'
            }
          </p>
          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-yellow-800 text-sm">
                <strong>Demo Mode:</strong> You can try the tools below, but you'll need to sign up to save your work and access all features.
              </p>
            </div>
          )}
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
          <a href="/features" className="text-center p-6 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-200 group">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600">Smart Summaries</h3>
            <p className="text-gray-600">
              Generate intelligent summaries with customizable length and style for any audience.
            </p>
          </a>

          <a href="/features" className="text-center p-6 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-200 group">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600">Exam Generation</h3>
            <p className="text-gray-600">
              Create comprehensive exams with various question types and difficulty levels automatically.
            </p>
          </a>

          <a href="/features" className="text-center p-6 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-200 group">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600">AI-Powered</h3>
            <p className="text-gray-600">
              Leverage advanced AI technology to analyze content and generate educational materials.
            </p>
          </a>
        </div>

        {/* Call to Action Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of educators and students who are already transforming their content with AI Study Circle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Sign Up Free
              </a>
              <a
                href="/how-it-works"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                Learn How It Works
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}