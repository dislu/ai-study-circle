'use client';

import { useState, useEffect } from 'react';
import { FileText, BookOpen, ClipboardCheck, BarChart3, Settings, LogOut, User } from 'lucide-react';
import Header from '@/components/Header';
import UploadModal from '@/components/UploadModal';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingTrigger, { QuickHelpButton } from '@/components/OnboardingTrigger';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    summariesGenerated: 0,
    examsCreated: 0,
    totalWords: 0
  });

  useEffect(() => {
    // Load stats data - in real app, fetch from API
    setStats({
      totalDocuments: 24,
      summariesGenerated: 18,
      examsCreated: 12,
      totalWords: 45678
    });
  }, []);

  const recentActivity = [
    { type: 'summary', title: 'Machine Learning Basics Summary', date: '2 hours ago', status: 'completed' },
    { type: 'exam', title: 'Python Programming Exam', date: '1 day ago', status: 'completed' },
    { type: 'upload', title: 'Data Structures Chapter 5', date: '2 days ago', status: 'processing' },
    { type: 'summary', title: 'Web Development Guide Summary', date: '3 days ago', status: 'completed' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'summary': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'exam': return <ClipboardCheck className="h-4 w-4 text-purple-600" />;
      case 'upload': return <FileText className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{user?.avatar || '👨‍💻'}</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name || 'User'}!
                  </h1>
                  <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <QuickHelpButton tourId="dashboard" />
                <OnboardingTrigger tourId="dashboard" autoStart showButton />
                <a href="/profile" className="btn btn-outline flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
                <button 
                  onClick={logout}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg w-12 h-12 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div data-tour="summary-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg w-12 h-12 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Summaries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.summariesGenerated}</p>
              </div>
            </div>
          </div>

          <div data-tour="exam-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg w-12 h-12 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.examsCreated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 rounded-lg w-12 h-12 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Words Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWords.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <a href="/documents" className="btn btn-outline">
                  View All Documents
                </a>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  data-tour="upload-button"
                  onClick={() => setShowUploadModal(true)}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Upload New Document</span>
                </button>
                <a href="/documents" className="btn btn-outline w-full flex items-center justify-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>View Documents</span>
                </a>
                <a href="/documents" className="btn btn-outline w-full flex items-center justify-center space-x-2">
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Manage Content</span>
                </a>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white mt-6">
              <h3 className="text-lg font-bold mb-2">Usage This Month</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-90">Documents</span>
                  <span className="font-semibold">8/50</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{width: '16%'}}></div>
                </div>
              </div>
              <div className="mt-4 text-sm opacity-90">
                You have 42 documents remaining this month.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </div>
  );
}