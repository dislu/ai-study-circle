'use client';

import { Sparkles, Github, User, LogOut, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Study Circle</h1>
              <p className="text-xs text-gray-500">Intelligent Content Analysis</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/features" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              Features
            </Link>
            <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              How it Works
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
              About
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Dashboard
                </Link>
                <Link href="/chat" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  AI Chat
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div data-tour="notifications">
                  <NotificationCenter />
                </div>
                <Link href="/dashboard" className="btn btn-outline flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth?mode=signin" className="btn btn-outline">Sign In</Link>
                <Link href="/auth?mode=signup" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}