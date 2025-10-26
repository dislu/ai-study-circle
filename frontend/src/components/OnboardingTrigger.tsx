'use client';

import { useEffect } from 'react';
import { HelpCircle, PlayCircle } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface OnboardingTriggerProps {
  tourId: string;
  autoStart?: boolean;
  showButton?: boolean;
  className?: string;
}

export default function OnboardingTrigger({ 
  tourId, 
  autoStart = false, 
  showButton = true,
  className = '' 
}: OnboardingTriggerProps) {
  const { startTour, isCompleted } = useOnboarding();

  useEffect(() => {
    // Auto-start tour for new users
    if (autoStart && !isCompleted(tourId)) {
      const hasSeenBefore = localStorage.getItem(`onboarding-seen-${tourId}`);
      if (!hasSeenBefore) {
        // Delay to ensure page is loaded
        const timer = setTimeout(() => {
          startTour(tourId);
          localStorage.setItem(`onboarding-seen-${tourId}`, 'true');
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [autoStart, tourId, startTour, isCompleted]);

  const handleStartTour = () => {
    startTour(tourId);
  };

  if (!showButton) return null;

  return (
    <div className={className}>
      <button
        onClick={handleStartTour}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        title="Take a guided tour"
      >
        <PlayCircle className="h-4 w-4" />
        <span>Take Tour</span>
      </button>
    </div>
  );
}

// Quick help button component
export function QuickHelpButton({ tourId, className = '' }: { tourId: string, className?: string }) {
  const { startTour } = useOnboarding();

  return (
    <button
      onClick={() => startTour(tourId)}
      className={`p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${className}`}
      title="Get help with this page"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}