import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNavigation from './MobileNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-app-background text-primary-navy">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Mobile Drawer (visible only when open on mobile) */}
      <MobileNavigation 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 md:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
