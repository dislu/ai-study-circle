'use client';

import { Sparkles, Github, Heart } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Study Circle</h1>
              <p className="text-xs text-gray-500">Intelligent Content Analysis</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm">
              How it Works
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 text-sm">
              About
            </a>
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
            
            <button className="btn-primary">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}