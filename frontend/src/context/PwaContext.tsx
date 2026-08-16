import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Define the BeforeInstallPromptEvent interface which is not natively in standard TS dom lib
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installApp: () => Promise<void>;
  isPromptSupported: boolean;
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
                       
  const hasLocalFlag = localStorage.getItem('pwaInstallCompleted') === 'true';
  
  return isStandalone || hasLocalFlag;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isPromptSupported, setIsPromptSupported] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isPWAInstalled());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsPromptSupported(true);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwaInstallCompleted', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also listen for display-mode changes just in case
    const matchMedia = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    matchMedia.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      matchMedia.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = async () => {
    if (isPWAInstalled()) {
      setIsInstalled(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }
    
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        // We set local flag to ensure state persists immediately after acceptance
        localStorage.setItem('pwaInstallCompleted', 'true');
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('Error prompting install:', err);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <PwaContext.Provider value={{ isInstallable, isInstalled, isInstalling, installApp, isPromptSupported }}>
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}
