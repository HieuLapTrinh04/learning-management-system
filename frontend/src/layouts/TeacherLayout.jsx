import React, { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  FileSpreadsheet,
  LogOut, 
  Menu, 
  X,
  User,
  CheckSquare,
  Bell,
  Tag,
  DollarSign
} from 'lucide-react';
import Breadcrumb from '../components/layout/Breadcrumb';
import { AuthContext } from '../App';
import NotificationDropdown from '../features/notification/NotificationDropdown';

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userName, userAvatar, handleLogout } = useContext(AuthContext);
  const { unreadCount } = useSelector((state) => state.notification);
  const { config: tenantConfig } = useSelector((state) => state.tenant);

  const navLinks = [
    { label: 'Bảng điều khiển', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Quản lý khóa học', to: '/teacher/course-builder', icon: BookOpen },
    { label: 'Chấm điểm bài tập', to: '/teacher/assignments', icon: CheckSquare },
    { label: 'Mã giảm giá', to: '/teacher/coupons', icon: Tag },
    { label: 'Lịch sử giao dịch', to: '/teacher/transactions', icon: FileSpreadsheet },
    { label: 'Rút tiền', to: '/teacher/rut-tien', icon: DollarSign },
    { label: 'Hồ sơ cá nhân', to: '/teacher/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 font-sans">
      
      {/* Sidebar Panel */}
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
        
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
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${isActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-500 hover:bg-red-950/20 hover:text-red-400 transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>

      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-slate-950 border-b border-slate-900/50 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-slate-200">
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
                    // Đối với Teacher, trang thông báo là trang chung nhưng chưa có tab bên thanh bar.
                    // Chúng ta có thể trỏ về trang dashboard hoặc định tuyến tương tự.
                    // Cho phép chuyển hướng đến trang thông báo nếu tab === 'notifications'.
                    if (tab === 'notifications') {
                      navigate('/teacher/notifications');
                    }
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-900 pl-4">
              <div className="text-right">
                <span className="text-xs font-semibold block text-slate-200">{userName}</span>
                <span className="text-[9px] uppercase font-mono text-amber-500 px-1.5 py-0.5 rounded bg-amber-950/20 border border-amber-500/20">TEACHER</span>
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
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
