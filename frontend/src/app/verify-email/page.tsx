'use client';

import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

export default function EmailVerificationPage() {
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('verifying');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to dashboard...');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0 || !email) return;
    
    try {
      setResendCooldown(60); // 60 second cooldown
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to resend email. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please try again later.');
      setResendCooldown(0);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Clock className="h-16 w-16 text-blue-600 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'error':
        return <Mail className="h-16 w-16 text-red-600" />;
      default:
        return <Mail className="h-16 w-16 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verifying': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'verifying': return 'Verifying Email...';
      case 'success': return 'Email Verified!';
      case 'error': return 'Verification Failed';
      default: return 'Verify Your Email';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              {getStatusIcon()}
            </div>
            
            <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
              {getTitle()}
            </h1>
            
            {status === 'pending' && !token && (
              <>
                <p className="text-gray-600 mb-6">
                  We've sent a verification email to <strong>{email}</strong>. 
                  Please check your inbox and click the verification link to activate your account.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={resendVerificationEmail}
                    disabled={resendCooldown > 0}
                    className="btn btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 
                        ? `Resend in ${resendCooldown}s` 
                        : 'Resend Verification Email'
                      }
                    </span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/auth?mode=signin')}
                    className="btn btn-outline w-full flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </>
            )}
            
            {status === 'verifying' && (
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            )}
            
            {status === 'success' && (
              <>
                <p className="text-gray-600 mb-4">
                  Your email has been successfully verified! You can now access all features of AI Study Circle.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to your dashboard...
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                
                <div className="space-y-3">
                  {email && (
                    <button
                      onClick={resendVerificationEmail}
                      disabled={resendCooldown > 0}
                      className="btn btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                      <span>
                        {resendCooldown > 0 
                          ? `Resend in ${resendCooldown}s` 
                          : 'Resend Verification Email'
                        }
                      </span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push('/auth?mode=signin')}
                    className="btn btn-outline w-full flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </>
            )}
            
            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                Didn't receive the email?
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email address</li>
                <li>• Contact support if problems persist</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}