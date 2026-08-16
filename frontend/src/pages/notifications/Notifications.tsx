import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Notification, NotificationResponse } from '../../types/notification';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const Notifications: React.FC = () => {
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterRead, setFilterRead] = useState<string>('all'); // 'all', 'unread', 'read'
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      let url = `/notifications?page=${page}&limit=10`;
      if (filterRead === 'unread') url += '&isRead=false';
      if (filterRead === 'read') url += '&isRead=true';
      
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filterRead]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
        });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.map(n => ({ ...n, isRead: true }))
        });
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 rounded-xl">
              <Bell className="text-brand-gold" size={24} />
            </div>
            Notifications
          </h1>
          <p className="text-sm font-medium text-muted-text mt-1">Stay updated with your latest alerts and actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterRead}
            onChange={(e) => { setFilterRead(e.target.value); setPage(1); }}
            className="border border-border-subtle rounded-xl px-4 py-2 text-sm font-semibold text-primary-text bg-gray-50 focus:border-action-blue focus:ring-1 focus:ring-action-blue outline-none"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            leftIcon={<CheckCircle2 size={16} className="text-green-600" />}
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : data?.notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Bell size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
            <p className="mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-5 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 ${
                  !notification.isRead ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <div className="mt-1">
                  <div className={`h-3 w-3 rounded-full ${!notification.isRead ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                        {notification.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * data.limit + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * data.limit, data.total)}</span> of{' '}
                  <span className="font-medium">{data.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-border-subtle bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-border-subtle bg-white text-sm font-semibold text-primary-text">
                    Page {page} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    disabled={page === data.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-border-subtle bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
