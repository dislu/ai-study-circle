'use client';

import { ArrowRight, Upload, Brain, Download, Zap } from 'lucide-react';
import Header from '@/components/Header';

export default function HowItWorksPage() {
  const steps = [
    {
      step: 1,
      icon: Upload,
      title: 'Upload Your Content',
      description: 'Upload documents, paste text, or import content from various sources.',
      details: [
        'Drag and drop files or paste text directly',
        'Support for PDF, Word, text files, and more',
        'Bulk upload for multiple documents',
        'Web content import via URL'
      ],
      color: 'blue'
    },
    {
      step: 2,
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our advanced AI analyzes your content to understand structure and key concepts.',
      details: [
        'Natural language processing and understanding',
        'Content structure and topic identification',
        'Key concept extraction and categorization',
        'Context-aware content analysis'
      ],
      color: 'purple'
    },
    {
      step: 3,
      icon: Zap,
      title: 'Generate Results',
      description: 'Choose to create summaries, exam questions, or both based on your needs.',
      details: [
        'Customizable summary length and style',
        'Multiple question types and difficulty levels',
        'Topic-based content organization',
        'Real-time generation with progress tracking'
      ],
      color: 'green'
    },
    {
      step: 4,
      icon: Download,
      title: 'Export & Share',
      description: 'Download your generated content or share it with team members.',
      details: [
        'Multiple export formats (PDF, Word, HTML)',
        'Team collaboration and sharing features',
        'Version history and revision tracking',
        'Integration with popular platforms'
      ],
      color: 'orange'
    }
  ];

  const useCases = [
    {
      title: 'Educators',
      description: 'Create comprehensive study materials and assessments from lecture notes and textbooks.',
      icon: '🎓',
      benefits: ['Save time on content creation', 'Ensure consistent quality', 'Focus on teaching instead of prep work']
    },
    {
      title: 'Students',
      description: 'Generate concise summaries and practice exams from course materials.',
      icon: '📚',
      benefits: ['Better study efficiency', 'Self-assessment tools', 'Organized learning materials']
    },
    {
      title: 'Corporate Training',
      description: 'Transform training materials into digestible content and assessments.',
      icon: '💼',
      benefits: ['Standardized training content', 'Employee assessment tools', 'Scalable learning programs']
    },
    {
      title: 'Content Creators',
      description: 'Repurpose long-form content into summaries and interactive materials.',
      icon: '✍️',
      benefits: ['Content multiplication', 'Audience engagement', 'Multi-format publishing']
    }
  ];

  const getStepColor = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' }
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
            How It Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your content into intelligent summaries and comprehensive exams 
            in just four simple steps.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = getStepColor(step.color);
              
              return (
                <div key={index} className="relative">
                  {/* Step Number */}
                  <div className="flex items-start space-x-6">
                    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl w-20 h-20 flex items-center justify-center flex-shrink-0`}>
                      <div className={`${colors.text} font-bold text-2xl`}>
                        {step.step}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className={`h-8 w-8 ${colors.text}`} />
                        <h3 className="text-2xl font-bold text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      
                      <div className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')} flex-shrink-0`}></div>
                            <span className="text-gray-700 text-sm">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow connector (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-6 top-10">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect For Every Use Case
            </h2>
            <p className="text-xl text-gray-600">
              See how different users benefit from AI Study Circle
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {useCase.description}
                </p>
                <div className="space-y-2">
                  {useCase.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                      <span className="text-gray-700 text-xs">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Try our interactive demo to experience the power of AI-driven content analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Try Interactive Demo
            </a>
            <a
              href="/auth"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors inline-flex items-center justify-center"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}