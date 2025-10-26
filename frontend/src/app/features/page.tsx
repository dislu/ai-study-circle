'use client';

import { BookOpen, ClipboardCheck, Sparkles, Zap, Globe, Shield, FileText, Users } from 'lucide-react';
import Header from '@/components/Header';

export default function FeaturesPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Smart Summaries',
      description: 'Generate intelligent summaries with customizable length and style for any audience.',
      details: [
        'Adjustable summary length (short, medium, long)',
        'Multiple summary styles (bullet points, paragraphs, key highlights)',
        'Context-aware content extraction',
        'Support for multiple languages'
      ],
      color: 'blue'
    },
    {
      icon: ClipboardCheck,
      title: 'Exam Generation',
      description: 'Create comprehensive exams with various question types and difficulty levels automatically.',
      details: [
        'Multiple choice, true/false, short answer questions',
        'Adjustable difficulty levels',
        'Topic-based question categorization',
        'Answer key generation with explanations'
      ],
      color: 'purple'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Analysis',
      description: 'Leverage advanced AI technology to analyze content and generate educational materials.',
      details: [
        'Natural language processing',
        'Content structure analysis',
        'Key concept identification',
        'Intelligent content categorization'
      ],
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Quick and efficient content processing with real-time progress tracking.',
      details: [
        'Parallel processing for faster results',
        'Real-time job status updates',
        'Batch processing capabilities',
        'Optimized for large documents'
      ],
      color: 'yellow'
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Support for multiple languages with accurate translation and localization.',
      details: [
        'Support for 50+ languages',
        'Automatic language detection',
        'Context-aware translations',
        'Cultural localization features'
      ],
      color: 'indigo'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy measures.',
      details: [
        'End-to-end encryption',
        'GDPR compliant data handling',
        'No data retention after processing',
        'Secure cloud infrastructure'
      ],
      color: 'red'
    },
    {
      icon: FileText,
      title: 'Multiple Formats',
      description: 'Support for various file formats including PDF, Word, text, and more.',
      details: [
        'PDF, DOCX, TXT file support',
        'Image text extraction (OCR)',
        'Web content importing',
        'Structured data formats (JSON, XML)'
      ],
      color: 'teal'
    },
    {
      icon: Users,
      title: 'Collaboration Tools',
      description: 'Share and collaborate on generated content with team members.',
      details: [
        'Team workspace creation',
        'Real-time collaboration',
        'Comment and feedback system',
        'Version history tracking'
      ],
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; accent: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600', accent: 'bg-green-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', accent: 'bg-yellow-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', accent: 'bg-indigo-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600', accent: 'bg-red-600' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-600', accent: 'bg-teal-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', accent: 'bg-pink-600' }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Powerful Features
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover all the capabilities that make AI Study Circle the perfect platform 
            for educational content creation and analysis.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colors = getColorClasses(feature.color);
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className={`${colors.bg} rounded-xl w-16 h-16 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-8 w-8 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {feature.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${colors.accent} flex-shrink-0`}></div>
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Content?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start using AI Study Circle today and experience the power of intelligent content analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Get Started Free
            </a>
            <a
              href="/"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              Try Demo
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}