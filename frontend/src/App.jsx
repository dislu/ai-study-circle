import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Languages, Settings, Bell, User, LogOut } from 'lucide-react';

// Import components
import Dashboard from './components/Dashboard';
import SummaryGenerator from './components/SummaryGenerator';
import ExamGenerator from './components/ExamGenerator';
import TemplateManager from './components/TemplateManager';
import LanguageSelector from './components/LanguageSelector';
import TranslationStatus from './components/TranslationStatus';
import AuthForm from './components/AuthForm';
import AuthCallback from './components/AuthCallback';
import UserProfile from './components/UserProfile';

// Import hooks
import { useTranslation } from './hooks/useTranslation';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [translationHealth, setTranslationHealth] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { 
    checkTranslationHealth, 
    lastTranslationMeta,
    translationError 
  } = useTranslation();

  useEffect(() => {
    checkHealth();
    loadUserSession();
  }, []);

  const checkHealth = async () => {
    const health = await checkTranslationHealth();
    setTranslationHealth(health);
  };

  const loadUserSession = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Validate token and get user profile
        const response = await fetch('/api/social/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.data);
          setSelectedLanguage(userData.data.preferences?.language || 'auto');
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setSelectedLanguage(userData.preferences?.language || 'auto');
    setCurrentView('dashboard');
  };

  const handleLanguageChange = (languageCode) => {
    setSelectedLanguage(languageCode);
    setShowLanguageSelector(false);
    
    // Update user preferences if logged in
    if (user) {
      updateUserPreferences({ language: languageCode });
    }
  };

  const updateUserPreferences = async (preferences) => {
    try {
      const response = await fetch('/api/social/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser.data);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/social/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setCurrentView('dashboard');
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'summary', label: 'Summary Generator', icon: '📝' },
    { id: 'exam', label: 'Exam Generator', icon: '🎯' },
    { id: 'templates', label: 'Template Manager', icon: '📋' },
    { id: 'profile', label: 'Profile Settings', icon: '⚙️' },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard selectedLanguage={selectedLanguage} />;
      case 'summary':
        return <SummaryGenerator selectedLanguage={selectedLanguage} />;
      case 'exam':
        return <ExamGenerator selectedLanguage={selectedLanguage} />;
      case 'templates':
        return <TemplateManager selectedLanguage={selectedLanguage} />;
      case 'profile':
        return <UserProfile user={user} onProfileUpdate={setUser} />;
      default:
        return <Dashboard selectedLanguage={selectedLanguage} />;
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not logged in
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route 
            path="/auth/callback" 
            element={<AuthCallback onAuthSuccess={handleAuthSuccess} />} 
          />
          <Route 
            path="/auth/error" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
                  <p className="text-gray-600 mb-6">There was a problem signing you in. Please try again.</p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            } 
          />
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Study Circle</h1>
                    <p className="text-gray-600">Multilingual AI-powered learning platform</p>
                    <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-600">
                      <Languages className="w-4 h-4" />
                      <span>Supports 16+ Indian languages</span>
                    </div>
                  </div>
                  
                  <AuthForm onAuthSuccess={handleAuthSuccess} />
                  
                  {/* Language Selector for initial setup */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <LanguageSelector
                      selectedLanguage={selectedLanguage}
                      onLanguageChange={setSelectedLanguage}
                      className="max-h-48 overflow-y-auto"
                    />
                  </div>
                </div>
              </div>
            } 
          />
        </Routes>
      </Router>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AI Study Circle</h1>
          <p className="text-sm text-gray-600 mt-1">Multilingual Learning</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Translation Health Status */}
          {translationHealth && (
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Translation Service</span>
                <div className={`w-2 h-2 rounded-full ${
                  translationHealth.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {translationHealth.status === 'healthy' ? 'All systems operational' : 'Limited functionality'}
              </p>
            </div>
          )}
        </nav>

        {/* Language Selector Toggle */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Languages className="w-5 h-5" />
              <span className="font-medium">Language</span>
            </div>
            <span className="text-sm text-gray-500">
              {selectedLanguage === 'auto' ? 'Auto' : selectedLanguage.toUpperCase()}
            </span>
          </button>

          {showLanguageSelector && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-500">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
              <Settings className="w-4 h-4 text-gray-400" />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                <button
                  onClick={() => {
                    setCurrentView('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {currentView.replace('-', ' ')}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedLanguage === 'auto' 
                  ? 'Automatic language detection enabled' 
                  : `Input language: ${selectedLanguage.toUpperCase()}`
                }
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Translation Error Indicator */}
              {translationError && (
                <div className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg">
                  Translation Error
                </div>
              )}

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Translation Status */}
        {lastTranslationMeta && (
          <div className="p-4 border-b border-gray-200">
            <TranslationStatus 
              translationMeta={lastTranslationMeta}
              showDetails={false}
            />
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default App;