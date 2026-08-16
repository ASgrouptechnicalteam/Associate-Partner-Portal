import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Tutorial } from '../types/tutorial';
import { getTutorialBySlug } from '../services/tutorialApi';

interface TutorialContextType {
  isActive: boolean;
  currentTutorial: Tutorial | null;
  currentStepIndex: number;
  startTutorial: (slug: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Watch for active step route change and auto-navigate if needed
  useEffect(() => {
    if (isActive && currentTutorial && currentTutorial.steps[currentStepIndex]) {
      const targetRoute = currentTutorial.steps[currentStepIndex].targetRoute;
      if (targetRoute && targetRoute !== location.pathname) {
        navigate(targetRoute);
      }
    }
  }, [isActive, currentStepIndex, currentTutorial, navigate, location.pathname]);

  const startTutorial = async (slug: string) => {
    try {
      const tutorial = await getTutorialBySlug(slug);
      if (tutorial && tutorial.steps.length > 0) {
        setCurrentTutorial(tutorial);
        setCurrentStepIndex(0);
        setIsActive(true);
      }
    } catch (err) {
      console.error('Failed to start tutorial:', err);
    }
  };

  const nextStep = () => {
    if (currentTutorial && currentStepIndex < currentTutorial.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const endTutorial = () => {
    setIsActive(false);
    setCurrentTutorial(null);
    setCurrentStepIndex(0);
  };

  return (
    <TutorialContext.Provider value={{
      isActive,
      currentTutorial,
      currentStepIndex,
      startTutorial,
      nextStep,
      prevStep,
      endTutorial
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
