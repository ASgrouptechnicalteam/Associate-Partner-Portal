import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { navigationConfig } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavigation = navigationConfig.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white text-primary-text border-r border-border-subtle shadow-sm h-full flex-shrink-0 z-20">
      {/* Branding */}
      <div className="flex items-center justify-center h-20 px-6 border-b border-border-subtle bg-white shrink-0">
        <img src="/logo.svg" alt="Sonthillu Constructions" className="h-14 w-auto max-w-[170px] object-contain" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1.5 px-4">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-action-blue/10 text-action-blue font-semibold'
                    : 'text-muted-text hover:bg-gray-50 hover:text-primary-navy'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              <span className="truncate tracking-wide text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-border-subtle bg-gray-50/50">

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
