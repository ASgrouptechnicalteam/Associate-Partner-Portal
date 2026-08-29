import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-border-subtle bg-white/80 backdrop-blur-lg px-6 shadow-sm z-10 sticky top-0">
      {/* Mobile Menu & Logo Space */}
      <div className="flex items-center gap-6 flex-1 relative">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-muted-text hover:bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-action-blue"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        <NotificationDropdown />
        
        <button onClick={() => navigate('/profile')} className="flex items-center gap-3 border-l pl-5 border-border-subtle cursor-pointer hover:opacity-80 transition-opacity text-left">
          <div className="flex flex-col items-end hidden sm:block">
            <span className="text-sm font-semibold text-primary-text block leading-tight">
              {user?.name}
            </span>
            <span className="text-xs text-brand-gold font-medium">{user?.role?.replace('_', ' ')}</span>
          </div>
          <Avatar name={user?.name || 'User'} imageUrl={user?.profileImageUrl} size="md" />
        </button>
      </div>
    </header>
  );
};

export default Header;
