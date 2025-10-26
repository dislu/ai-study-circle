'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'sent'>('request');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setStep('sent');
      } else {
        const error = await response.json();
        setError(error.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {step === 'request' ? (
              <>
                <div className="text-center mb-6">
                  <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`input pl-10 ${error ? 'border-red-500' : ''}`}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    {error && <p className="form-error">{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth?mode=signin"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600 mb-6">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  
                  <div className="space-y-3">
                    <Link
                      href="/auth?mode=signin"
                      className="btn btn-primary w-full"
                    >
                      Back to Sign In
                    </Link>
                    
                    <button
                      onClick={() => setStep('request')}
                      className="btn btn-outline w-full"
                    >
                      Send to Different Email
                    </button>
                  </div>
                  
                  {/* Help Text */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      Didn't receive the email?
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Check your spam/junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• The link expires in 1 hour</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}