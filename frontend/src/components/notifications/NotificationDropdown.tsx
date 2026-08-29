import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, X, Briefcase, Building2, Tag, MapPin, Calendar, Users, ShieldCheck, Info, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Notification } from '../../types/notification';

/** Returns a Lucide icon + colour pair based on notification category */
const getCategoryMeta = (category: string): { icon: React.ReactNode; bg: string; text: string } => {
  switch (category?.toLowerCase()) {
    case 'booking':
      return { icon: <Briefcase size={16} />, bg: 'bg-blue-50', text: 'text-blue-600' };
    case 'project':
      return { icon: <Building2 size={16} />, bg: 'bg-indigo-50', text: 'text-indigo-600' };
    case 'offer':
      return { icon: <Tag size={16} />, bg: 'bg-amber-50', text: 'text-amber-600' };
    case 'site visit':
      return { icon: <MapPin size={16} />, bg: 'bg-green-50', text: 'text-green-600' };
    case 'demo booking':
      return { icon: <Calendar size={16} />, bg: 'bg-purple-50', text: 'text-purple-600' };
    case 'team':
      return { icon: <Users size={16} />, bg: 'bg-rose-50', text: 'text-rose-600' };
    case 'approval':
      return { icon: <ShieldCheck size={16} />, bg: 'bg-emerald-50', text: 'text-emerald-600' };
    default:
      return { icon: <Info size={16} />, bg: 'bg-gray-100', text: 'text-gray-600' };
  }
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsError(false);
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/v1/notifications?limit=50'),
        api.get('/v1/notifications/unread-count')
      ]);
      setNotifications(listRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      setShowAll(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/v1/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/v1/notifications/${notification.id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark as read on click:', error);
      }
    }
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    if (!notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await api.patch(`/v1/notifications/${notification.id}/dismiss`);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      setNotifications(previousNotifications);
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        className="relative p-2 rounded-full text-gray-500 hover:text-primary-navy hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-action-blue/50"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        id="notification-bell-btn"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden z-50 origin-top sm:origin-top-right animate-in fade-in zoom-in-95 duration-200" style={{ maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <h2 id="notification-modal-title" className="text-base font-bold text-gray-900">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-action-blue text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs font-semibold text-action-blue hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <CheckCircle2 size={13} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close notifications panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="py-14 text-center px-6">
                <p className="text-sm font-semibold text-red-600 mb-2">Unable to load notifications</p>
                <button 
                  onClick={fetchNotifications}
                  className="text-xs font-medium bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-14 text-center px-6">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="text-gray-300" size={28} />
                </div>
                <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">Updates from bookings, projects, offers and site visits will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {displayedNotifications.map((notification) => {
                  const meta = getCategoryMeta(notification.category);
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer flex gap-3 group ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-full ${meta.bg} ${meta.text} flex items-center justify-center`}>
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={(e) => handleDismiss(e, notification)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors opacity-70 group-hover:opacity-100"
                          aria-label="Dismiss notification"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-action-blue mt-1"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && !showAll && (
            <div className="p-3 border-t border-gray-100 bg-white shrink-0 text-center">
              <button 
                onClick={() => setShowAll(true)}
                className="text-sm font-semibold text-action-blue hover:text-blue-700 hover:underline transition-colors w-full text-center"
              >
                View All Notifications
              </button>
            </div>
          )}
          {showAll && notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-center shrink-0">
              <p className="text-xs text-gray-500">End of notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
