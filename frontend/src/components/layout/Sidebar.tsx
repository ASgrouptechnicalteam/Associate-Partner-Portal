import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navigationConfig } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const isNavigationItemActive = (itemPath: string, pathname: string, search: string) => {
  const [itemBase, itemQuery] = itemPath.split('?');
  const currentParams = new URLSearchParams(search);
  const currentFilter = currentParams.get('filter');
  const itemFilter = new URLSearchParams(itemQuery || '').get('filter');

  // Exact match or nested path
  const isBaseMatch = pathname === itemBase;
  const isNestedMatch = pathname.startsWith(itemBase + '/');

  if (!isBaseMatch && !isNestedMatch) {
    return false;
  }

  // If the navigation item has a specific filter (e.g. Hot Deals)
  if (itemFilter) {
    return isBaseMatch && currentFilter === itemFilter;
  }

  // If the navigation item has NO specific filter (e.g. Projects)
  // It shouldn't be active if we're viewing a specific filtered view that has its own nav item.
  if (!itemFilter) {
    if (currentFilter === 'hot' || currentFilter === 'featured') {
      return false;
    }
    return true; // Active for base path or nested paths without special filters
  }

  return false;
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavigation = navigationConfig.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <aside className="hidden md:flex flex-col w-64 md:w-72 bg-deep-navy text-white border-r border-deep-navy/80 shadow-2xl shadow-blue-900/20 h-full flex-shrink-0 z-20">
      {/* Branding Header */}
      <div className="flex items-center gap-3 h-20 px-6 border-b border-white/10 bg-deep-navy shrink-0">
        <img 
          src="/logo.svg" 
          alt="Sonthillu Constructions Logo" 
          className="h-10 w-10 object-contain drop-shadow-md brightness-200 shrink-0" 
        />
        <h1 className="text-[15px] font-bold leading-tight text-white">
          Marketing &<br/>Sales Portal
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-1.5 px-4">
          {filteredNavigation.map((item) => {
            const isActive = isNavigationItemActive(item.path, pathname, search);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-gold to-yellow-500 text-deep-navy font-bold shadow-lg shadow-brand-gold/20'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                <span className="truncate tracking-wide text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
