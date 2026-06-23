import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Check, DollarSign, GraduationCap, Award, BookOpen, Clock } from 'lucide-react';
import { markAsRead, markAllAsRead } from './notificationSlice';

export default function NotificationDropdown({ token, onClose, onNavigate }) {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  // Lấy 5 thông báo mới nhất
  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAll = (e) => {
    e.stopPropagation();
    dispatch(markAllAsRead(token));
  };

  const handleNotificationClick = (id, isRead) => {
    if (!isRead) {
      dispatch(markAsRead({ id, token }));
    }
    // Không tự động đóng dropdown để người dùng xem, hoặc có thể đóng tùy thích.
  };

  const handleViewAll = () => {
    onNavigate('notifications');
    if (onClose) onClose();
  };

  // Trả về icon thích hợp dựa trên nội dung thông báo
  const getNotificationIcon = (title, message) => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes('thanh toán') || text.includes('vnpay') || text.includes('tiền') || text.includes('hóa đơn')) {
      return <DollarSign className="w-4 h-4 text-emerald-500" />;
    }
    if (text.includes('chứng chỉ') || text.includes('certificate') || text.includes('hoàn thành')) {
      return <Award className="w-4 h-4 text-amber-500" />;
    }
    if (text.includes('quiz') || text.includes('thi') || text.includes('trắc nghiệm')) {
      return <BookOpen className="w-4 h-4 text-sky-500" />;
    }
    if (text.includes('bài tập') || text.includes('assignment') || text.includes('chấm điểm')) {
      return <GraduationCap className="w-4 h-4 text-indigo-500" />;
    }
    return <Bell className="w-4 h-4 text-brand-500" />;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      const now = new Date();
      
      // Nếu là hôm nay
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      // Khác ngày
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-950 border border-slate-900 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Dropdown Header */}
      <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/30">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">Thông báo</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-brand-500 text-slate-950 text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAll}
            className="text-[10px] text-brand-500 hover:text-brand-400 font-semibold transition flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-900/60">
        {notifications.length === 0 ? (
          <div className="py-8 px-4 text-center text-xs text-slate-500">
            Không có thông báo nào.
          </div>
        ) : (
          recentNotifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => handleNotificationClick(n.id, n.is_read)}
              className={`p-4 hover:bg-slate-900/40 cursor-pointer transition relative flex gap-3 ${n.is_read ? 'opacity-50' : 'bg-slate-900/20'}`}
            >
              {/* Unread indicator dot */}
              {!n.is_read && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
              )}
              
              {/* Icon Container */}
              <div className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(n.title, n.message)}
              </div>

              {/* Text Area */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-slate-200 truncate">{n.title}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-500">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatTime(n.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="p-3 bg-slate-900/40 border-t border-slate-900 text-center">
        <button 
          onClick={handleViewAll}
          className="text-xs text-brand-500 hover:text-brand-400 font-semibold transition w-full py-1 rounded-lg hover:bg-slate-900/20"
        >
          Xem tất cả thông báo
        </button>
      </div>
    </div>
  );
}
