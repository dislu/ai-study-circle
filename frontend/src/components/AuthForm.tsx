'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface AuthFormProps {
  onAuthSuccess?: (user: any) => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthForm({ onAuthSuccess, initialMode = 'signin' }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, signup, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      let success = false;
      
      if (mode === 'signin') {
        success = await login(formData.email, formData.password);
      } else {
        success = await signup(formData.name, formData.email, formData.password);
      }

      if (success) {
        onAuthSuccess?.(true);
      } else {
        setErrors({ submit: 'Authentication failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Mock social login - in real app, integrate with OAuth providers
    alert(`${provider} login would be implemented here`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-600">
          {mode === 'signin' 
            ? 'Sign in to access your AI Study Circle' 
            : 'Join AI Study Circle to get started'
          }
        </p>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleSocialLogin('Google')}
          className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            G
          </div>
          <span>Continue with Google</span>
        </button>
        
        <button
          onClick={() => handleSocialLogin('Facebook')}
          className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            f
          </div>
          <span>Continue with Facebook</span>
        </button>
        
        <button
          onClick={() => handleSocialLogin('Microsoft')}
          className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
          <span>Continue with Microsoft</span>
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="form-group">
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input pl-10 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
        )}

        <div className="form-group">
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`input pl-10 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`input pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
            </div>
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>
        )}

        {errors.submit && (
          <div className="alert-error">
            <p>{errors.submit}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {mode === 'signin' && (
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
            Forgot your password?
          </Link>
        </div>
      )}
    </div>
  );
}