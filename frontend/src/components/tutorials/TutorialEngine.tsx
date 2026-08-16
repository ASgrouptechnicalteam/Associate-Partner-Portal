import React, { useEffect, useState } from 'react';
import { useTutorial } from '../../context/TutorialContext';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export const TutorialEngine: React.FC = () => {
  const { isActive, currentTutorial, currentStepIndex, nextStep, prevStep, endTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    if (!isActive || !currentTutorial) return;

    const currentStep = currentTutorial.steps[currentStepIndex];
    
    const updatePosition = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      
      if (currentStep.targetSelector) {
        const el = document.querySelector(currentStep.targetSelector);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
          // Optional: scroll into view
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setTargetRect(null); // Fallback to centered modal
        }
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // true for capture phase

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isActive, currentTutorial, currentStepIndex]);

  if (!isActive || !currentTutorial) return null;

  const currentStep = currentTutorial.steps[currentStepIndex];
  const isLastStep = currentStepIndex === currentTutorial.steps.length - 1;
  const isMobile = windowSize.width < 768;

  // Determine popover position based on target rect and available space
  let popoverStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
  };

  const showSpotlight = targetRect && !isMobile;

  if (showSpotlight && targetRect) {
    // Position near the target
    const spaceBelow = windowSize.height - targetRect.bottom;
    
    if (spaceBelow > 250) {
      popoverStyle.top = `${targetRect.bottom + 16}px`;
      popoverStyle.left = `${Math.max(16, targetRect.left)}px`;
    } else {
      popoverStyle.top = `${targetRect.top - 200 > 16 ? targetRect.top - 200 : 16}px`;
      popoverStyle.left = `${Math.max(16, targetRect.left)}px`;
    }
  } else {
    // Centered Modal (fallback or mobile)
    popoverStyle = {
      ...popoverStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? '90%' : '400px',
    };
  }

  return (
    <>
      {/* Overlay / Spotlight */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/40 pointer-events-none transition-all duration-300"
        style={{
          clipPath: showSpotlight && targetRect ? 
            `polygon(0% 0%, 0% 100%, ${targetRect.left - 8}px 100%, ${targetRect.left - 8}px ${targetRect.top - 8}px, ${targetRect.right + 8}px ${targetRect.top - 8}px, ${targetRect.right + 8}px ${targetRect.bottom + 8}px, ${targetRect.left - 8}px ${targetRect.bottom + 8}px, ${targetRect.left - 8}px 100%, 100% 100%, 100% 0%)`
            : undefined
        }}
      />
      
      {/* Popover */}
      <div style={popoverStyle} className="pointer-events-auto">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{currentStep.title}</h3>
          <button onClick={endTutorial} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6 text-sm leading-relaxed whitespace-pre-wrap">
          {currentStep.explanation}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-500 font-medium">
            Step {currentStepIndex + 1} of {currentTutorial.steps.length}
          </div>
          
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center shadow-sm"
            >
              {isLastStep ? (
                <>Finish <Check className="w-4 h-4 ml-1" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
