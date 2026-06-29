import React, { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  GraduationCap,
  LayoutDashboard,
  Layers,
  CheckSquare,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
  Bell,
  CreditCard,
  Tag,
  Star,
  MessageSquare,
  Users,
  Wallet
} from 'lucide-react';
import Breadcrumb from '../components/layout/Breadcrumb';
import { AuthContext } from '../App';
import NotificationDropdown from '../features/notification/NotificationDropdown';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userName, userAvatar, handleLogout } = useContext(AuthContext);
  const { unreadCount } = useSelector((state) => state.notification);
  const { config: tenantConfig } = useSelector((state) => state.tenant);

  const navLinks = [
    { label: 'Bảng điều khiển', shortLabel: 'Tổng quan', to: '/admin/bang-dieu-khien', icon: LayoutDashboard },
    { label: 'Quản lý người dùng', shortLabel: 'Tài khoản', to: '/admin/quan-ly-nguoi-dung', icon: Users },
    { label: 'Quản lý danh mục', shortLabel: 'Danh mục', to: '/admin/danh-muc', icon: Layers },
    { label: 'Phê duyệt khóa học', shortLabel: 'Duyệt', to: '/admin/phe-duyet-khoa-hoc', icon: CheckSquare },
    { label: 'Quản lý Lộ trình', to: '/admin/quan-ly-lo-trinh', icon: Layers },
    { label: 'Báo cáo giao dịch', to: '/admin/giao-dich', icon: CreditCard },
    { label: 'Duyệt rút tiền', to: '/admin/rut-tien', icon: Wallet },
    { label: 'Quản lý Coupon', to: '/admin/ma-giam-gia', icon: Tag },
    { label: 'Kiểm duyệt Đánh giá', to: '/admin/danh-gia', icon: Star },
    { label: 'Đánh giá trang chủ', to: '/admin/loi-chung-thuc', icon: MessageSquare },
    { label: 'Nhật ký hệ thống', to: '/admin/nhat-ky-he-thong', icon: ShieldCheck },
    { label: 'Hồ sơ cá nhân', to: '/admin/ho-so', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 font-sans">

      {/* Sidebar Panel - Offcanvas on mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-50 w-[240px] sm:w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'} overflow-y-auto`}>

        <div>
          {/* Header brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900">
            <Link to="/dashboard" className="flex items-center gap-3">
              {tenantConfig?.logo_url ? (
                <img src={tenantConfig.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-slate-950" />
                </div>
              )}
              {sidebarOpen && (
                <span className="font-serif text-sm font-bold bg-gradient-to-r from-amber-100 to-amber-500 bg-clip-text text-transparent">
                  {tenantConfig?.name || 'Online LMS'}
                </span>
              )}
            </Link>

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl text-[11px] sm:text-xs font-semibold tracking-wide transition ${isActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer logout */}
        <div className="p-3 sm:p-4 border-t border-slate-900 pb-20 md:pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-500 hover:bg-red-950/20 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>

      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className="h-16 bg-slate-950 border-b border-slate-900/50 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block text-slate-400 hover:text-slate-200 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <Breadcrumb />
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-brand-500 flex items-center justify-center border border-slate-800 transition duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <NotificationDropdown
                  token={token}
                  onClose={() => setShowNotificationDropdown(false)}
                  onNavigate={(tab) => {
                    if (tab === 'notifications') {
                      navigate('/admin/notifications');
                    }
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-900 pl-4">
              <div className="text-right">
                <span className="text-xs font-semibold block text-slate-200">{userName}</span>
                <span className="text-[9px] uppercase font-mono text-amber-500 px-1.5 py-0.5 rounded bg-amber-950/20 border border-amber-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ADMIN</span>
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 z-50 flex items-center justify-around pb-safe pt-2">
        {navLinks.slice(0, 4).map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link key={link.to} to={link.to} className={`flex flex-col items-center gap-1 p-2 flex-1 ${isActive ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] text-center font-medium line-clamp-1">{link.shortLabel || link.label}</span>
            </Link>
          );
        })}
        {/* More Menu Toggle */}
        <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-1 p-2 flex-1 text-slate-400 hover:text-slate-200">
          <Menu className="w-5 h-5" />
          <span className="text-[10px] text-center font-medium">Menu</span>
        </button>
      </div>

    </div>
  );
}
