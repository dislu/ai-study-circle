'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  const validateToken = async (resetToken: string) => {
    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken })
      });

      setIsValidToken(response.ok);
    } catch (error) {
      setIsValidToken(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setStatus('loading');

    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      });

      if (response.ok) {
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth?mode=signin');
        }, 3000);
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to reset password. Please try again.' });
        setStatus('error');
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
      setStatus('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { level: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) return { level: strength, text: 'Weak', color: 'text-red-600' };
    if (strength <= 3) return { level: strength, text: 'Fair', color: 'text-yellow-600' };
    if (strength <= 4) return { level: strength, text: 'Good', color: 'text-blue-600' };
    return { level: strength, text: 'Strong', color: 'text-green-600' };
  };

  // Show loading state while validating token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show invalid token message
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password" className="btn btn-primary w-full">
                  Request New Reset Link
                </Link>
                <Link href="/auth?mode=signin" className="btn btn-outline w-full">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {status === 'success' ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Password Reset Successful!
                </h1>
                <p className="text-gray-600 mb-4">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to sign in page...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Reset Your Password
                  </h1>
                  <p className="text-gray-600">
                    Enter your new password below.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="label">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getPasswordStrength().level <= 2 ? 'bg-red-500' :
                                getPasswordStrength().level <= 3 ? 'bg-yellow-500' :
                                getPasswordStrength().level <= 4 ? 'bg-blue-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${(getPasswordStrength().level / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`text-sm ${getPasswordStrength().color}`}>
                            {getPasswordStrength().text}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {errors.password && <p className="form-error">{errors.password}</p>}
                  </div>

                  <div className="form-group">
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`input pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        placeholder="Confirm new password"
                      />
                    </div>
                    {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
                  </div>

                  {errors.submit && (
                    <div className="alert-error">
                      <p>{errors.submit}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn btn-primary w-full"
                  >
                    {status === 'loading' ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth?mode=signin"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}