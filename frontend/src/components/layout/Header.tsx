import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import api, { getStaticUrl } from '../../services/api';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // API Call
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      setIsSearching(true);
      api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => {
          if (res.data.success) {
            setSearchResults(res.data.results);
            setShowDropdown(true);
          }
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults(null);
      setShowDropdown(false);
    }
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    navigate(path);
    setShowDropdown(false);
    setSearchQuery('');
  };

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-border-subtle bg-white px-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] z-10">
      {/* Mobile Menu & Search */}
      <div className="flex items-center gap-6 flex-1 relative" ref={searchRef}>
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-muted-text hover:bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-action-blue"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden sm:flex items-center bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-2 w-full max-w-md focus-within:bg-white focus-within:ring-2 focus-within:ring-action-blue/20 focus-within:border-action-blue transition-all">
          <Search size={18} className="text-gray-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search projects, bookings, or colleagues..." 
            className="bg-transparent border-none outline-none text-sm w-full text-primary-text placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults) setShowDropdown(true); }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-14 left-12 w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
            {isSearching ? (
              <div className="p-4 flex items-center justify-center text-gray-500">
                <Loader2 className="animate-spin mr-2" size={18} /> Searching...
              </div>
            ) : searchResults ? (
              <div className="max-h-[400px] overflow-y-auto">
                {searchResults.projects?.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">PROJECTS</div>
                    {searchResults.projects.map((p: any) => (
                      <div key={p.id} onClick={() => handleResultClick(`/projects/${p.id}`)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="font-medium text-sm text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.code} • {p.location}</div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.associates?.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">ASSOCIATES</div>
                    {searchResults.associates.map((a: any) => (
                      <div key={a.id} onClick={() => handleResultClick(`/team`)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="font-medium text-sm text-gray-900">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.associateId} • {a.role.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.bookings?.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">BOOKINGS</div>
                    {searchResults.bookings.map((b: any) => (
                      <div key={b.id} onClick={() => handleResultClick(`/bookings/${b.id}`)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="font-medium text-sm text-gray-900">{b.customerName}</div>
                        <div className="text-xs text-gray-500">{b.project?.name} • {b.status}</div>
                      </div>
                    ))}
                  </div>
                )}
                {(!searchResults.projects?.length && !searchResults.associates?.length && !searchResults.bookings?.length) && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No results found for "{debouncedQuery}"
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        <NotificationDropdown />
        
        <button onClick={() => navigate('/profile')} className="flex items-center gap-3 border-l pl-5 border-border-subtle cursor-pointer hover:opacity-80 transition-opacity text-left">
          <div className="flex flex-col items-end hidden sm:block">
            <span className="text-sm font-semibold text-primary-text block leading-tight">
              {user?.name}
            </span>
            <span className="text-xs text-muted-text">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-navy/5 text-primary-navy text-sm font-bold border border-primary-navy/10 shrink-0 overflow-hidden">
            {user?.profileImageUrl ? (
              <img src={getStaticUrl(user.profileImageUrl)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name.charAt(0).toUpperCase() || 'U'
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
