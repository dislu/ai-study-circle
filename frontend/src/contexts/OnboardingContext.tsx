'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Action to perform (e.g., 'click', 'hover')
  skippable?: boolean;
}

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: OnboardingStep | null;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  isCompleted: (tourId: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

// Tour definitions
const tours: Record<string, OnboardingStep[]> = {
  'dashboard': [
    {
      id: 'welcome',
      title: 'Welcome to AI Study Circle! 🎉',
      content: 'Let\'s take a quick tour to help you get started with our powerful AI-powered study tools.',
      skippable: true
    },
    {
      id: 'upload-doc',
      title: 'Upload Your Documents',
      content: 'Start by uploading your study materials - PDFs, Word docs, or text files. Our AI will analyze them for you.',
      target: '[data-tour="upload-button"]',
      position: 'bottom'
    },
    {
      id: 'generate-summary',
      title: 'Generate AI Summaries',
      content: 'Once uploaded, generate comprehensive summaries of your documents with just one click.',
      target: '[data-tour="summary-section"]',
      position: 'right'
    },
    {
      id: 'create-exams',
      title: 'Create Practice Exams',
      content: 'Test your knowledge with AI-generated exams based on your study materials.',
      target: '[data-tour="exam-section"]',
      position: 'right'
    },
    {
      id: 'notifications',
      title: 'Stay Updated',
      content: 'Keep track of your progress and get notified when your content is ready.',
      target: '[data-tour="notifications"]',
      position: 'left'
    }
  ],
  'documents': [
    {
      id: 'documents-intro',
      title: 'Your Document Library',
      content: 'This is where all your uploaded documents are organized and managed.',
      skippable: true
    },
    {
      id: 'search-filter',
      title: 'Find Documents Quickly',
      content: 'Use search and filters to quickly locate specific documents by name, subject, or status.',
      target: '[data-tour="search-bar"]',
      position: 'bottom'
    },
    {
      id: 'document-actions',
      title: 'Document Actions',
      content: 'Each document has actions available - generate summaries, create exams, or download results.',
      target: '[data-tour="document-card"]',
      position: 'top'
    },
    {
      id: 'export-feature',
      title: 'Export Your Work',
      content: 'Export summaries and exams in multiple formats - PDF, Word, or text files.',
      target: '[data-tour="export-button"]',
      position: 'top'
    }
  ],
  'profile': [
    {
      id: 'profile-intro',
      title: 'Your Profile & Settings',
      content: 'Customize your experience and track your learning progress.',
      skippable: true
    },
    {
      id: 'study-stats',
      title: 'Study Statistics',
      content: 'Monitor your learning progress with detailed statistics and achievements.',
      target: '[data-tour="stats-section"]',
      position: 'bottom'
    },
    {
      id: 'preferences',
      title: 'Personalize Settings',
      content: 'Adjust notification preferences, AI settings, and other personal preferences.',
      target: '[data-tour="settings-section"]',
      position: 'top'
    }
  ]
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentTour, setCurrentTour] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>([]);

  useEffect(() => {
    // Load completed tours from localStorage
    const saved = localStorage.getItem('onboarding-completed');
    if (saved) {
      setCompletedTours(JSON.parse(saved));
    }
  }, []);

  const currentTourSteps = currentTour ? tours[currentTour] || [] : [];
  const totalSteps = currentTourSteps.length;
  const currentStepData = currentTourSteps[currentStep] || null;

  const startTour = (tourId: string) => {
    if (!tours[tourId]) return;
    
    setCurrentTour(tourId);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentTour('');
    setCurrentStep(0);
  };

  const completeTour = () => {
    const newCompleted = [...completedTours, currentTour];
    setCompletedTours(newCompleted);
    localStorage.setItem('onboarding-completed', JSON.stringify(newCompleted));
    
    setIsActive(false);
    setCurrentTour('');
    setCurrentStep(0);
  };

  const isCompleted = (tourId: string) => {
    return completedTours.includes(tourId);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps,
        currentStepData,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        isCompleted
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};