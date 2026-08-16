import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { navigationConfig } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogOut, X } from 'lucide-react';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle escape key & body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // prevent scroll
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const filteredNavigation = navigationConfig.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-[280px] bg-white text-primary-text shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-border-subtle bg-white shrink-0">
          <div className="flex items-center justify-start h-full">
            <img src="/logo.svg" alt="Sonthillu Constructions" className="h-8 w-auto object-contain" />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-primary-navy rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1.5 px-4">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose} // Auto-close on route change
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-action-blue/10 text-action-blue font-semibold'
                      : 'text-muted-text hover:bg-gray-50 hover:text-primary-navy'
                  }`
                }
              >
                <item.icon size={22} className="shrink-0" />
                <span className="text-base tracking-wide truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Profile & Logout */}
        <div className="p-4 border-t border-border-subtle bg-gray-50/50 shrink-0">

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
