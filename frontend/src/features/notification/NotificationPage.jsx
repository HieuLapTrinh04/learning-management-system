import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Bell, Check, DollarSign, GraduationCap, Award, BookOpen, 
  Clock, ArrowLeft, RefreshCw, MailOpen, Mail, ShieldAlert 
} from 'lucide-react';
import { fetchNotifications, markAsRead, markAllAsRead } from './notificationSlice';

export default function NotificationPage({ token, onNavigate }) {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, error } = useSelector((state) => state.notification);
  
  // Trạng thái tab bộ lọc: 'all', 'unread', 'read'
  const [filterTab, setFilterTab] = useState('all');

  const handleRefresh = () => {
    dispatch(fetchNotifications(token));
  };

  const handleMarkAll = () => {
    dispatch(markAllAsRead(token));
  };

  const handleNotificationClick = (id, isRead) => {
    if (!isRead) {
      dispatch(markAsRead({ id, token }));
    }
  };

  // Trích xuất icon phù hợp
  const getNotificationIcon = (title, message) => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes('thanh toán') || text.includes('vnpay') || text.includes('tiền') || text.includes('hóa đơn')) {
      return <DollarSign className="w-5 h-5 text-emerald-500" />;
    }
    if (text.includes('chứng chỉ') || text.includes('certificate') || text.includes('hoàn thành')) {
      return <Award className="w-5 h-5 text-amber-500" />;
    }
    if (text.includes('quiz') || text.includes('thi') || text.includes('trắc nghiệm')) {
      return <BookOpen className="w-5 h-5 text-sky-500" />;
    }
    if (text.includes('bài tập') || text.includes('assignment') || text.includes('chấm điểm')) {
      return <GraduationCap className="w-5 h-5 text-indigo-500" />;
    }
    return <Bell className="w-5 h-5 text-brand-500" />;
  };

  const formatDateTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Lọc thông báo dựa trên tab đang chọn
  const filteredNotifications = notifications.filter(n => {
    if (filterTab === 'unread') return !n.is_read;
    if (filterTab === 'read') return n.is_read;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Navigation Header */}
      <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 sm:gap-x-4 sm:gap-y-1 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl items-center">
        <h1 className="font-serif text-lg sm:text-3xl font-bold text-slate-100 flex items-center gap-2 sm:gap-3 col-start-1 row-start-1">
          <Bell className="w-5 h-5 sm:w-8 sm:h-8 text-brand-500 flex-shrink-0" />
          <span className="truncate">Quản Lý Thông Báo</span>
        </h1>
        
        <p className="text-[9px] sm:text-xs text-slate-400 col-start-1 row-start-2">
          Xem và xử lý thông báo, cập nhật điểm số, thanh toán và chứng nhận.
        </p>

        <div className="flex gap-1.5 sm:gap-2 col-start-2 row-start-1 row-span-2 items-center justify-end">
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-none p-2 sm:py-2.5 sm:px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg sm:rounded-xl flex items-center justify-center transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Làm mới</span>
          </button>

          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAll}
              className="flex-none p-2 sm:py-2.5 sm:px-4 bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold rounded-lg sm:rounded-xl flex items-center justify-center transition"
              title="Đánh dấu tất cả đã đọc"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline ml-2">Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Filter tabs & List content */}
      <div className="bg-slate-900/10 border border-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        
        {/* Filter Toolbar */}
        <div className="flex border-b border-slate-900 pb-3 sm:pb-4 mb-4 sm:mb-6 gap-1.5 sm:gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition ${filterTab === 'all' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition ${filterTab === 'unread' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            onClick={() => setFilterTab('read')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold transition ${filterTab === 'read' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Đã đọc ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Content list */}
        {isLoading && notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
            <span className="text-xs text-slate-500">Đang đồng bộ danh mục thông báo...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <MailOpen className="w-12 h-12 text-slate-800" />
            <span className="text-sm">Không tìm thấy thông báo nào trong bộ lọc này.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.id, n.is_read)}
                className={`group p-5 bg-slate-950/40 border border-slate-900 rounded-2xl flex gap-4 transition hover:bg-slate-900/20 cursor-pointer relative ${!n.is_read ? 'shadow-md border-brand-500/20' : 'opacity-60'}`}
              >
                {/* Visual Unread Glow */}
                {!n.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-l-2xl"></div>
                )}

                {/* Left Icon Panel */}
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(n.title, n.message)}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                      <span>{n.title}</span>
                      {!n.is_read && (
                        <span className="inline-block w-2 h-2 rounded-full bg-brand-500"></span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateTime(n.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{n.message}</p>
                </div>

                {/* Status Toggle Hover Helper */}
                {!n.is_read && (
                  <div className="self-center opacity-0 group-hover:opacity-100 transition pl-2 hidden sm:block">
                    <span className="py-1.5 px-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-brand-500 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition">
                      <Mail className="w-3 h-3" />
                      Đọc tin
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
