'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check, SkipForward } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function OnboardingTour() {
  const {
    isActive,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipTour,
    completeTour
  } = useOnboarding();

  const [highlightElement, setHighlightElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || !currentStepData?.target) {
      setHighlightElement(null);
      return;
    }

    // Find and highlight target element
    const element = document.querySelector(currentStepData.target);
    if (element) {
      setHighlightElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const position = calculateTooltipPosition(rect, currentStepData.position);
      setTooltipPosition(position);

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, currentStepData]);

  const calculateTooltipPosition = (rect: DOMRect, position = 'bottom') => {
    const offset = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - offset,
          left: Math.max(10, rect.left + rect.width / 2 - tooltipWidth / 2)
        };
      case 'bottom':
        return {
          top: rect.bottom + offset,
          left: Math.max(10, rect.left + rect.width / 2 - tooltipWidth / 2)
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: Math.max(10, rect.left - tooltipWidth - offset)
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + offset
        };
      default:
        return {
          top: rect.bottom + offset,
          left: Math.max(10, rect.left + rect.width / 2 - tooltipWidth / 2)
        };
    }
  };

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Highlight */}
      {highlightElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightElement.getBoundingClientRect().top - 4,
            left: highlightElement.getBoundingClientRect().left - 4,
            width: highlightElement.getBoundingClientRect().width + 8,
            height: highlightElement.getBoundingClientRect().height + 8,
            border: '3px solid #3B82F6',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm"
        style={{
          top: Math.max(10, Math.min(window.innerHeight - 220, tooltipPosition.top)),
          left: Math.max(10, Math.min(window.innerWidth - 330, tooltipPosition.left)),
          width: '320px'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {currentStepData.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          {currentStepData.skippable && (
            <button
              onClick={skipTour}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="btn btn-outline btn-sm flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
            {currentStepData.skippable && (
              <button
                onClick={skipTour}
                className="btn btn-outline btn-sm flex items-center space-x-2 text-gray-600"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip Tour</span>
              </button>
            )}
          </div>

          <button
            onClick={currentStep === totalSteps - 1 ? completeTour : nextStep}
            className="btn btn-primary btn-sm flex items-center space-x-2"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Check className="h-4 w-4" />
                <span>Complete</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
}