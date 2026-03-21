import { useState, useEffect } from 'react';
import { agentService } from '../../api/agentApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
  FaBell, FaSync, FaRegClock, FaCircle,
  FaExclamationCircle, FaInfoCircle, FaBullhorn, FaCheckDouble,
  FaTrash
} from 'react-icons/fa';
import { BellOff, Trash2 } from 'lucide-react';

export default function AgentNotifications() {
  const { setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await agentService.getNotifications();
      const list = data?.notifications || data || [];
      setNotifications(list);
      
      // Update global unread count
      const unread = list.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      toast.error(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Mark as "seen" by resetting global unread count when page is viewed
    setUnreadCount(0);
  }, []);

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return then.toLocaleDateString('en-IN');
  };

  const getNotificationIcon = (title) => {
    const lower = title?.toLowerCase() || '';
    if (lower.includes('withdrawal')) return { icon: FaMoneyBillWave, color: '#10B981', bg: '#10B98115' };
    if (lower.includes('booking')) return { icon: FaBell, color: '#3B82F6', bg: '#3B82F615' };
    if (lower.includes('alert') || lower.includes('warning')) return { icon: FaExclamationCircle, color: '#EF4444', bg: '#EF444415' };
    return { icon: FaInfoCircle, color: '#8B5CF6', bg: '#8B5CF615' };
  };

  const handleMarkAllRead = async () => {
    try {
      // Local update to simulate mark all as read
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 py-6 px-4 sm:px-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900">
              <FaBell className="text-blue-600 text-lg sm:text-xl" />
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all sm:hidden"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <FaCheckDouble size={14} />
            Mark All Read
          </button>
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all hidden sm:block"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BellOff size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
          <p className="text-sm text-gray-500">You're all caught up! Check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const icon = getNotificationIcon(n.title);
            return (
              <div
                key={n._id}
                className={`bg-white rounded-xl border ${!n.read ? 'border-blue-200 shadow-md' : 'border-gray-200'
                  } hover:shadow-lg transition-all relative overflow-hidden`}
              >
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: icon.bg }}
                    >
                      <icon.icon size={20} style={{ color: icon.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={`text-base font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </h3>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FaRegClock size={12} />
                          {getTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}