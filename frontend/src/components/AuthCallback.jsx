import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback = ({ onAuthSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh');
      const providerName = searchParams.get('provider');
      const error = searchParams.get('error');

      setProvider(providerName || '');

      if (error) {
        setStatus('error');
        setMessage(decodeURIComponent(error));
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('No authentication token received');
        return;
      }

      // Store tokens
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Fetch user profile
      const response = await fetch('/api/social/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        setStatus('success');
        setMessage(`Successfully signed in with ${providerName}`);
        
        // Call success callback after a short delay
        setTimeout(() => {
          onAuthSuccess(userData.data);
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('Failed to fetch user profile');
      }

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  };

  const getProviderIcon = (providerName) => {
    const icons = {
      google: (
        <svg className="w-8 h-8" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      facebook: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      microsoft: (
        <svg className="w-8 h-8" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z"/>
          <path fill="#00A4EF" d="M13 1h10v10H13z"/>
          <path fill="#7FBA00" d="M1 13h10v10H1z"/>
          <path fill="#FFB900" d="M13 13h10v10H13z"/>
        </svg>
      )
    };

    return icons[provider] || <div className="w-8 h-8 bg-gray-300 rounded-full" />;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-600" />;
      default:
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Provider Icon */}
        {provider && (
          <div className="flex justify-center mb-4">
            {getProviderIcon(provider)}
          </div>
        )}

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <div className="space-y-2">
          <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
            {status === 'processing' && 'Completing Sign In'}
            {status === 'success' && 'Sign In Successful!'}
            {status === 'error' && 'Sign In Failed'}
          </h2>
          
          <p className="text-gray-600">
            {status === 'processing' && 'Please wait while we complete your authentication...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
        </div>

        {/* Action Buttons */}
        {status === 'error' && (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full text-gray-600 hover:text-gray-800 py-2 px-4 transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;