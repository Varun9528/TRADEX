import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../api';
import { Bell, Check, Trash2, X } from 'lucide-react';

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await notificationAPI.getAll({ limit: 10 });
      return data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const unreadCount = notificationsData?.filter(n => !n.isRead).length || 0;
  const notifications = notificationsData || [];

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'fund_added':
        return <span className="text-brand-green">💰</span>;
      case 'withdrawal_processed':
        return <span className="text-accent-red">💳</span>;
      case 'order_executed':
        return <span className="text-brand-blue">📈</span>;
      case 'kyc_approved':
        return <span className="text-brand-green">✅</span>;
      case 'kyc_rejected':
        return <span className="text-accent-red">❌</span>;
      default:
        return <Bell size={16} />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-bg-card border border-border rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col" style={{ pointerEvents: 'auto' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-bold text-text-primary">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-text-secondary">Loading...</div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 hover:bg-bg-tertiary transition-colors ${
                        !notification.isRead ? 'bg-brand-blue/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary">{notification.message}</div>
                          <div className="text-xs text-text-secondary mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markReadMutation.mutate(notification._id)}
                              className="text-text-secondary hover:text-brand-blue p-1"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(notification._id)}
                            className="text-text-secondary hover:text-accent-red p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-text-secondary">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
