# AI Study Circle - Frontend Implementation and Database Design

**Document 3: Frontend Components, Database Models, and User Interface**

---

## Table of Contents

1. [Frontend Implementation](#frontend-implementation)
2. [React Components](#react-components)
3. [Database Design](#database-design)
4. [User Interface Design](#user-interface-design)
5. [State Management](#state-management)
6. [API Integration](#api-integration)

---

## Frontend Implementation

### 1. **Project Structure**

```
frontend/
├── public/
│   ├── index.html              # Main HTML template
│   ├── manifest.json           # PWA manifest
│   └── favicon.ico             # App favicon
├── src/
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   │   ├── AuthForm.jsx    # Login/signup form
│   │   │   ├── AuthCallback.jsx # OAuth callback handler
│   │   │   └── UserProfile.jsx  # User profile management
│   │   ├── generators/         # AI generator components
│   │   │   ├── SummaryGenerator.jsx
│   │   │   └── ExamGenerator.jsx
│   │   ├── common/             # Shared components
│   │   │   ├── Header.jsx      # App header
│   │   │   ├── Footer.jsx      # App footer
│   │   │   ├── Loading.jsx     # Loading spinner
│   │   │   └── ErrorBoundary.jsx # Error handling
│   │   └── translation/        # Translation components
│   │       └── LanguageSelector.jsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js          # Authentication hook
│   │   ├── useTranslation.js   # Translation hook
│   │   └── useLocalStorage.js  # Local storage hook
│   ├── services/               # API service layer
│   │   ├── api.js              # Base API configuration
│   │   ├── authService.js      # Authentication service
│   │   ├── translationService.js # Translation service
│   │   └── contentService.js   # Content analysis service
│   ├── utils/                  # Utility functions
│   │   ├── constants.js        # App constants
│   │   ├── helpers.js          # Helper functions
│   │   └── validation.js       # Form validation
│   ├── styles/                 # CSS styling
│   │   ├── global.css          # Global styles
│   │   ├── components.css      # Component styles
│   │   └── responsive.css      # Responsive design
│   ├── App.js                  # Main app component
│   ├── index.js                # App entry point
│   └── setupTests.js           # Test configuration
├── package.json                # Dependencies and scripts
└── README.md                   # Frontend documentation
```

### 2. **Main App Component**

#### App.js
```javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { TranslationProvider } from './hooks/useTranslation';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import AuthForm from './components/auth/AuthForm';
import AuthCallback from './components/auth/AuthCallback';
import UserProfile from './components/auth/UserProfile';
import SummaryGenerator from './components/generators/SummaryGenerator';
import ExamGenerator from './components/generators/ExamGenerator';
import Dashboard from './components/Dashboard';
import Loading from './components/common/Loading';
import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load user preferences
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Check authentication status
        const token = localStorage.getItem('authToken');
        if (token) {
          // Validate token with backend
          // This will be handled by AuthProvider
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <Loading />
        <p>Initializing AI Study Circle...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <TranslationProvider>
          <Router>
            <div className="App" data-theme={theme}>
              <Header theme={theme} onToggleTheme={toggleTheme} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/login" element={<AuthForm />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/summary" element={<SummaryGenerator />} />
                  <Route path="/exam" element={<ExamGenerator />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </TranslationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
```

## React Components

### 1. **Authentication Components**

#### AuthForm.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSelector from '../translation/LanguageSelector';
import Loading from '../common/Loading';
import { User, LogIn, Globe } from 'lucide-react';

const AuthForm = () => {
  const { user, login, isLoading } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const location = useLocation();
  const [error, setError] = useState('');

  // Get redirect URL from state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // Check for error in URL params
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'auth_failed') {
      setError(t('auth.loginFailed'));
    }
  }, [location.search, t]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSocialLogin = (provider) => {
    setError('');
    login(provider);
  };

  const socialProviders = [
    {
      name: 'google',
      displayName: t('auth.continueWithGoogle'),
      icon: '🔍',
      color: '#4285f4',
      textColor: '#fff'
    },
    {
      name: 'facebook',
      displayName: t('auth.continueWithFacebook'),
      icon: '👥',
      color: '#1877f2',
      textColor: '#fff'
    },
    {
      name: 'microsoft',
      displayName: t('auth.continueWithMicrosoft'),
      icon: '🖱️',
      color: '#0078d4',
      textColor: '#fff'
    }
  ];

  if (isLoading) {
    return (
      <div className="auth-loading">
        <Loading />
        <p>{t('auth.authenticating')}</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <User size={48} />
          </div>
          <h1>{t('auth.welcome')}</h1>
          <p>{t('auth.welcomeMessage')}</p>
        </div>

        {/* Language Selector */}
        <div className="auth-language-selector">
          <div className="language-icon">
            <Globe size={20} />
          </div>
          <LanguageSelector />
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="social-login-container">
          <h3>{t('auth.signInWith')}</h3>
          
          {socialProviders.map((provider) => (
            <button
              key={provider.name}
              className="social-login-btn"
              style={{
                backgroundColor: provider.color,
                color: provider.textColor
              }}
              onClick={() => handleSocialLogin(provider.name)}
              disabled={isLoading}
            >
              <span className="provider-icon">{provider.icon}</span>
              <span className="provider-text">{provider.displayName}</span>
              <LogIn size={20} />
            </button>
          ))}
        </div>

        {/* Features List */}
        <div className="auth-features">
          <h4>{t('auth.features')}</h4>
          <ul>
            <li>📚 {t('auth.feature1')}</li>
            <li>🌍 {t('auth.feature2')}</li>
            <li>🤖 {t('auth.feature3')}</li>
            <li>📊 {t('auth.feature4')}</li>
          </ul>
        </div>

        {/* Privacy Notice */}
        <div className="auth-privacy">
          <p>
            {t('auth.privacyNotice1')}{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              {t('auth.privacyPolicy')}
            </a>{' '}
            {t('auth.privacyNotice2')}{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              {t('auth.termsOfService')}
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
```

#### AuthCallback.jsx
```javascript
import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import Loading from '../common/Loading';
import { CheckCircle, XCircle } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback, user, isLoading } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(t('auth.callbackError'));
          return;
        }

        if (!token || !provider) {
          setStatus('error');
          setMessage(t('auth.invalidCallback'));
          return;
        }

        // Process the callback
        const result = await handleCallback(token, provider);
        
        if (result.success) {
          setStatus('success');
          setMessage(t('auth.loginSuccess'));
        } else {
          setStatus('error');
          setMessage(result.error || t('auth.loginFailed'));
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('error');
        setMessage(t('auth.unexpectedError'));
      }
    };

    processCallback();
  }, [searchParams, handleCallback, t]);

  // Redirect to dashboard if authenticated
  if (user && status === 'success') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to login on error after delay
  if (status === 'error') {
    setTimeout(() => {
      window.location.href = '/login?error=callback_failed';
    }, 3000);
  }

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        {status === 'processing' && (
          <>
            <Loading />
            <h2>{t('auth.processing')}</h2>
            <p>{t('auth.processingMessage')}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">
              <CheckCircle size={64} color="#10b981" />
            </div>
            <h2>{t('auth.success')}</h2>
            <p>{message}</p>
            <p>{t('auth.redirecting')}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="error-icon">
              <XCircle size={64} color="#ef4444" />
            </div>
            <h2>{t('auth.error')}</h2>
            <p>{message}</p>
            <p>{t('auth.redirectingToLogin')}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
```

#### UserProfile.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSelector from '../translation/LanguageSelector';
import Loading from '../common/Loading';
import { 
  User, 
  Mail, 
  Calendar, 
  Globe, 
  Palette, 
  Save, 
  LogOut, 
  Settings 
} from 'lucide-react';

const UserProfile = () => {
  const { user, updatePreferences, logout, isLoading } = useAuth();
  const { t, currentLanguage, changeLanguage, getSupportedLanguages } = useTranslation();
  const [formData, setFormData] = useState({
    language: currentLanguage,
    theme: 'light'
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    if (user?.preferences) {
      setFormData({
        language: user.preferences.language || currentLanguage,
        theme: user.preferences.theme || 'light'
      });
    }
  }, [user, currentLanguage]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePreferences = async () => {
    setIsUpdating(true);
    setUpdateMessage('');

    try {
      const result = await updatePreferences(formData);
      
      if (result.success) {
        setUpdateMessage(t('profile.updateSuccess'));
        
        // Update language if changed
        if (formData.language !== currentLanguage) {
          changeLanguage(formData.language);
        }

        // Update theme if changed
        if (formData.theme !== document.documentElement.getAttribute('data-theme')) {
          document.documentElement.setAttribute('data-theme', formData.theme);
          localStorage.setItem('theme', formData.theme);
        }
      } else {
        setUpdateMessage(t('profile.updateError'));
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      setUpdateMessage(t('profile.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('profile.confirmLogout'))) {
      logout();
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="profile-loading">
        <Loading />
        <p>{t('profile.loading')}</p>
      </div>
    );
  }

  const supportedLanguages = getSupportedLanguages();

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user.profile?.picture ? (
              <img 
                src={user.profile.picture} 
                alt={user.name}
                className="avatar-image"
              />
            ) : (
              <User size={64} />
            )}
          </div>
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p className="profile-email">
              <Mail size={16} />
              {user.email}
            </p>
            <p className="profile-provider">
              {t('profile.signedInWith')} {user.profile?.provider}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-section">
          <h3>
            <Settings size={20} />
            {t('profile.accountDetails')}
          </h3>
          
          <div className="profile-details">
            <div className="detail-item">
              <Calendar size={16} />
              <span>{t('profile.memberSince')}</span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            
            <div className="detail-item">
              <Calendar size={16} />
              <span>{t('profile.lastLogin')}</span>
              <span>{formatDate(user.lastLogin)}</span>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="profile-section">
          <h3>
            <Settings size={20} />
            {t('profile.preferences')}
          </h3>

          {/* Language Preference */}
          <div className="preference-item">
            <label>
              <Globe size={16} />
              {t('profile.language')}
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="preference-select"
            >
              {Object.entries(supportedLanguages).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.native} ({info.name})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Preference */}
          <div className="preference-item">
            <label>
              <Palette size={16} />
              {t('profile.theme')}
            </label>
            <select
              value={formData.theme}
              onChange={(e) => handleInputChange('theme', e.target.value)}
              className="preference-select"
            >
              <option value="light">{t('profile.lightTheme')}</option>
              <option value="dark">{t('profile.darkTheme')}</option>
            </select>
          </div>

          {/* Update Message */}
          {updateMessage && (
            <div className={`update-message ${updateMessage.includes('success') ? 'success' : 'error'}`}>
              {updateMessage}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSavePreferences}
            disabled={isUpdating}
            className="save-preferences-btn"
          >
            {isUpdating ? (
              <>
                <Loading size="small" />
                {t('profile.updating')}
              </>
            ) : (
              <>
                <Save size={16} />
                {t('profile.savePreferences')}
              </>
            )}
          </button>
        </div>

        {/* Usage Statistics */}
        <div className="profile-section">
          <h3>{t('profile.usageStats')}</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">{t('profile.summariesGenerated')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">{t('profile.examsCreated')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">{t('profile.documentsAnalyzed')}</span>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="profile-section logout-section">
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut size={16} />
            {t('profile.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
```

### 2. **AI Generator Components**

#### SummaryGenerator.jsx
```javascript
import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSelector from '../translation/LanguageSelector';
import Loading from '../common/Loading';
import { 
  FileText, 
  Upload, 
  Type, 
  Settings, 
  Download,
  Copy,
  RefreshCw,
  BookOpen
} from 'lucide-react';

const SummaryGenerator = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const fileInputRef = useRef(null);
  
  const [inputData, setInputData] = useState({
    text: '',
    file: null,
    type: 'general',
    length: 'medium',
    language: currentLanguage,
    customPrompt: ''
  });
  
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const summaryTypes = [
    { value: 'academic', label: t('summary.typeAcademic') },
    { value: 'business', label: t('summary.typeBusiness') },
    { value: 'technical', label: t('summary.typeTechnical') },
    { value: 'general', label: t('summary.typeGeneral') }
  ];

  const lengthOptions = [
    { value: 'short', label: t('summary.lengthShort') },
    { value: 'medium', label: t('summary.lengthMedium') },
    { value: 'long', label: t('summary.lengthLong') },
    { value: 'detailed', label: t('summary.lengthDetailed') }
  ];

  const handleInputChange = (field, value) => {
    setInputData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(t('summary.fileSizeError'));
        return;
      }

      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError(t('summary.fileTypeError'));
        return;
      }

      setInputData(prev => ({
        ...prev,
        file
      }));
      setError('');
    }
  };

  const validateInput = () => {
    if (activeTab === 'text') {
      if (!inputData.text.trim()) {
        setError(t('summary.textRequired'));
        return false;
      }
      if (inputData.text.trim().length < 50) {
        setError(t('summary.textTooShort'));
        return false;
      }
    } else {
      if (!inputData.file) {
        setError(t('summary.fileRequired'));
        return false;
      }
    }
    return true;
  };

  const generateSummary = async () => {
    if (!validateInput()) return;

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      
      if (activeTab === 'text') {
        formData.append('text', inputData.text);
      } else {
        formData.append('file', inputData.file);
      }
      
      formData.append('type', inputData.type);
      formData.append('length', inputData.length);
      formData.append('language', inputData.language);
      
      if (inputData.customPrompt.trim()) {
        formData.append('customPrompt', inputData.customPrompt);
      }

      const response = await fetch('/api/summary/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || t('summary.generationError'));
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setError(t('summary.networkError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copySummary = async () => {
    if (result?.summary) {
      try {
        await navigator.clipboard.writeText(result.summary);
        // Show temporary success message
      } catch (error) {
        console.error('Copy error:', error);
      }
    }
  };

  const downloadSummary = () => {
    if (result?.summary) {
      const blob = new Blob([result.summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetForm = () => {
    setInputData({
      text: '',
      file: null,
      type: 'general',
      length: 'medium',
      language: currentLanguage,
      customPrompt: ''
    });
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="summary-generator">
      <div className="generator-header">
        <div className="header-content">
          <BookOpen size={32} />
          <div>
            <h1>{t('summary.title')}</h1>
            <p>{t('summary.description')}</p>
          </div>
        </div>
        <LanguageSelector 
          value={inputData.language}
          onChange={(lang) => handleInputChange('language', lang)}
        />
      </div>

      <div className="generator-container">
        {/* Input Section */}
        <div className="input-section">
          <div className="input-tabs">
            <button
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <Type size={16} />
              {t('summary.textInput')}
            </button>
            <button
              className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              <Upload size={16} />
              {t('summary.fileInput')}
            </button>
          </div>

          {/* Text Input Tab */}
          {activeTab === 'text' && (
            <div className="text-input-container">
              <textarea
                value={inputData.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
                placeholder={t('summary.textPlaceholder')}
                className="text-input"
                rows={10}
              />
              <div className="input-info">
                <span className="char-count">
                  {inputData.text.length} {t('summary.characters')}
                </span>
              </div>
            </div>
          )}

          {/* File Input Tab */}
          {activeTab === 'file' && (
            <div className="file-input-container">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.pdf,.docx"
                className="file-input"
              />
              <div className="file-upload-area">
                <FileText size={48} />
                <p>{t('summary.fileUploadText')}</p>
                <p className="file-types">{t('summary.supportedTypes')}</p>
                {inputData.file && (
                  <div className="selected-file">
                    <span>{inputData.file.name}</span>
                    <button onClick={() => handleInputChange('file', null)}>
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuration Section */}
          <div className="config-section">
            <h3>
              <Settings size={20} />
              {t('summary.configuration')}
            </h3>

            <div className="config-grid">
              <div className="config-item">
                <label>{t('summary.type')}</label>
                <select
                  value={inputData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  {summaryTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-item">
                <label>{t('summary.length')}</label>
                <select
                  value={inputData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                >
                  {lengthOptions.map(length => (
                    <option key={length.value} value={length.value}>
                      {length.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="config-item">
              <label>{t('summary.customPrompt')}</label>
              <textarea
                value={inputData.customPrompt}
                onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                placeholder={t('summary.customPromptPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={generateSummary}
              disabled={isGenerating}
              className="generate-btn"
            >
              {isGenerating ? (
                <>
                  <Loading size="small" />
                  {t('summary.generating')}
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  {t('summary.generateButton')}
                </>
              )}
            </button>

            <button onClick={resetForm} className="reset-btn">
              <RefreshCw size={16} />
              {t('summary.reset')}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="result-section">
            <div className="result-header">
              <h3>{t('summary.resultTitle')}</h3>
              <div className="result-actions">
                <button onClick={copySummary} className="action-btn">
                  <Copy size={16} />
                  {t('summary.copy')}
                </button>
                <button onClick={downloadSummary} className="action-btn">
                  <Download size={16} />
                  {t('summary.download')}
                </button>
              </div>
            </div>

            <div className="summary-content">
              <div className="summary-text">
                {result.summary}
              </div>

              {/* Metadata */}
              <div className="summary-metadata">
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">{t('summary.originalWords')}</span>
                    <span className="value">{result.metadata.wordCount.original}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">{t('summary.summaryWords')}</span>
                    <span className="value">{result.metadata.wordCount.summary}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">{t('summary.compression')}</span>
                    <span className="value">{result.metadata.compressionRatio}%</span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">{t('summary.processingTime')}</span>
                    <span className="value">{result.metadata.processingTime}ms</span>
                  </div>
                </div>

                {/* Keywords */}
                {result.metadata.keywords.length > 0 && (
                  <div className="keywords-section">
                    <h4>{t('summary.keywords')}</h4>
                    <div className="keywords">
                      {result.metadata.keywords.map((keyword, index) => (
                        <span key={index} className="keyword">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryGenerator;
```

## Database Design

### 1. **User Model**

```javascript
// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Social Authentication IDs
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  facebookId: {
    type: String,
    sparse: true,
    unique: true
  },
  microsoftId: {
    type: String,
    sparse: true,
    unique: true
  },

  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email) => {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Profile Information
  profile: {
    firstName: String,
    lastName: String,
    picture: String,
    provider: {
      type: String,
      enum: ['google', 'facebook', 'microsoft'],
      required: true
    },
    bio: {
      type: String,
      maxlength: 500
    }
  },

  // User Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'sa', 'sd', 'ne', 'gom']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark']
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    }
  },

  // Usage Statistics
  stats: {
    summariesGenerated: { type: Number, default: 0 },
    examsCreated: { type: Number, default: 0 },
    documentsAnalyzed: { type: Number, default: 0 },
    totalUsageTime: { type: Number, default: 0 }, // in minutes
    favoriteFeatures: [String]
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  
  // Subscription Information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    features: [String]
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.googleId;
      delete ret.facebookId;
      delete ret.microsoftId;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ facebookId: 1 }, { sparse: true });
userSchema.index({ microsoftId: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim() || this.name;
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
userSchema.methods.updateStats = function(action) {
  switch(action) {
    case 'summary':
      this.stats.summariesGenerated += 1;
      break;
    case 'exam':
      this.stats.examsCreated += 1;
      break;
    case 'document':
      this.stats.documentsAnalyzed += 1;
      break;
  }
  return this.save();
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
```

### 2. **Content Model**

```javascript
// src/models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  // Owner Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Content Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  originalText: {
    type: String,
    required: true
  },
  processedText: {
    type: String // English version if translated
  },

  // Content Metadata
  metadata: {
    type: {
      type: String,
      enum: ['text', 'pdf', 'docx', 'url'],
      default: 'text'
    },
    fileName: String,
    fileSize: Number,
    language: {
      detected: String,
      confidence: Number,
      original: String
    },
    wordCount: {
      original: Number,
      processed: Number
    },
    readingTime: Number, // estimated minutes
    complexity: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },

  // Processing Information
  processing: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    translationApplied: Boolean,
    aiProcessed: Boolean,
    processingTime: Number, // milliseconds
    error: String
  },

  // Content Analysis
  analysis: {
    topics: [String],
    keywords: [String],
    entities: [String],
    sentiment: {
      score: Number,
      label: String
    },
    readabilityScore: Number
  },

  // Usage Tracking
  usage: {
    summariesGenerated: { type: Number, default: 0 },
    examsGenerated: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
    accessCount: { type: Number, default: 0 }
  },

  // Content Tags and Categories
  tags: [String],
  category: {
    type: String,
    enum: ['academic', 'business', 'technical', 'personal', 'research', 'other'],
    default: 'other'
  },

  // Privacy Settings
  privacy: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  },
  sharedWith: [{
    userId: mongoose.Schema.Types.ObjectId,
    permission: {
      type: String,
      enum: ['read', 'edit'],
      default: 'read'
    },
    sharedAt: { type: Date, default: Date.now }
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
contentSchema.index({ userId: 1, createdAt: -1 });
contentSchema.index({ 'metadata.type': 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ 'processing.status': 1 });
contentSchema.index({ 'usage.lastAccessed': -1 });

// Text search index
contentSchema.index({
  title: 'text',
  originalText: 'text',
  'analysis.topics': 'text',
  'analysis.keywords': 'text'
});

// Virtual for estimated reading time
contentSchema.virtual('estimatedReadingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.metadata.wordCount.original || 0;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Pre-save middleware
contentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate word count if not set
  if (!this.metadata.wordCount.original && this.originalText) {
    this.metadata.wordCount.original = this.originalText.split(/\s+/).length;
  }
  
  // Set reading time
  if (!this.metadata.readingTime) {
    this.metadata.readingTime = this.estimatedReadingTime;
  }
  
  next();
});

// Instance methods
contentSchema.methods.incrementUsage = function(type) {
  if (type === 'summary') {
    this.usage.summariesGenerated += 1;
  } else if (type === 'exam') {
    this.usage.examsGenerated += 1;
  }
  
  this.usage.accessCount += 1;
  this.usage.lastAccessed = new Date();
  
  return this.save();
};

contentSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

contentSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Static methods
contentSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  return this.find(query)
    .sort({ [options.sortBy || 'createdAt']: options.sortOrder || -1 })
    .limit(options.limit || 50);
};

contentSchema.statics.searchContent = function(userId, searchTerm) {
  return this.find({
    userId,
    $text: { $search: searchTerm }
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Content', contentSchema);
```

### 3. **Summary Model**

```javascript
// src/models/Summary.js
const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  // Reference Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    index: true
  },

  // Summary Content
  originalText: {
    type: String,
    required: true
  },
  summaryText: {
    type: String,
    required: true
  },
  
  // Summary Configuration
  configuration: {
    type: {
      type: String,
      enum: ['academic', 'business', 'technical', 'general'],
      default: 'general'
    },
    length: {
      type: String,
      enum: ['short', 'medium', 'long', 'detailed'],
      default: 'medium'
    },
    language: {
      type: String,
      default: 'en'
    },
    customPrompt: String
  },

  // Processing Metadata
  metadata: {
    wordCount: {
      original: Number,
      summary: Number
    },
    compressionRatio: Number, // percentage
    processingTime: Number, // milliseconds
    model: String, // AI model used
    confidence: Number,
    language: {
      detected: String,
      processed: String,
      final: String
    },
    translationApplied: Boolean
  },

  // Analysis Results
  analysis: {
    keywords: [String],
    mainTopics: [String],
    keyPoints: [String],
    qualityScore: Number, // 0-100
    readabilityScore: Number
  },

  // User Interaction
  interaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    isBookmarked: { type: Boolean, default: false },
    shareCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 }
  },

  // Export Information
  exports: [{
    format: {
      type: String,
      enum: ['txt', 'pdf', 'docx', 'html']
    },
    exportedAt: { type: Date, default: Date.now },
    fileSize: Number
  }],

  // Status and Lifecycle
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived', 'deleted'],
    default: 'completed'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
summarySchema.index({ userId: 1, createdAt: -1 });
summarySchema.index({ contentId: 1 });
summarySchema.index({ 'configuration.type': 1 });
summarySchema.index({ 'configuration.language': 1 });
summarySchema.index({ status: 1 });
summarySchema.index({ 'interaction.rating': 1 });

// Text search index
summarySchema.index({
  summaryText: 'text',
  'analysis.keywords': 'text',
  'analysis.mainTopics': 'text'
});

// Virtual properties
summarySchema.virtual('compressionPercentage').get(function() {
  return this.metadata.compressionRatio ? `${this.metadata.compressionRatio}%` : 'N/A';
});

summarySchema.virtual('processingTimeFormatted').get(function() {
  const time = this.metadata.processingTime;
  if (!time) return 'N/A';
  
  if (time < 1000) return `${time}ms`;
  if (time < 60000) return `${(time / 1000).toFixed(1)}s`;
  return `${(time / 60000).toFixed(1)}m`;
});

// Pre-save middleware
summarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate compression ratio if not set
  if (!this.metadata.compressionRatio && this.metadata.wordCount) {
    const { original, summary } = this.metadata.wordCount;
    if (original && summary) {
      this.metadata.compressionRatio = Math.round((1 - summary / original) * 100);
    }
  }
  
  next();
});

// Instance methods
summarySchema.methods.addRating = function(rating, feedback) {
  this.interaction.rating = rating;
  if (feedback) {
    this.interaction.feedback = feedback;
  }
  return this.save();
};

summarySchema.methods.bookmark = function() {
  this.interaction.isBookmarked = true;
  return this.save();
};

summarySchema.methods.unbookmark = function() {
  this.interaction.isBookmarked = false;
  return this.save();
};

summarySchema.methods.recordExport = function(format, fileSize) {
  this.exports.push({
    format,
    fileSize,
    exportedAt: new Date()
  });
  this.interaction.downloadCount += 1;
  return this.save();
};

summarySchema.methods.recordShare = function() {
  this.interaction.shareCount += 1;
  return this.save();
};

// Static methods
summarySchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) {
    query['configuration.type'] = options.type;
  }
  
  if (options.language) {
    query['configuration.language'] = options.language;
  }
  
  if (options.isBookmarked) {
    query['interaction.isBookmarked'] = true;
  }
  
  return this.find(query)
    .populate('contentId', 'title category')
    .sort({ [options.sortBy || 'createdAt']: options.sortOrder || -1 })
    .limit(options.limit || 50);
};

summarySchema.statics.getStatsByUser = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSummaries: { $sum: 1 },
        averageRating: { $avg: '$interaction.rating' },
        totalDownloads: { $sum: '$interaction.downloadCount' },
        totalShares: { $sum: '$interaction.shareCount' },
        typeBreakdown: {
          $push: '$configuration.type'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Summary', summarySchema);
```

---

**Document Status**: Complete  
**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Next Document**: Docker Implementation and Deployment Guide