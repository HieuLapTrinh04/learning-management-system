import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GraduationCap, LogIn, ArrowRight } from 'lucide-react';

export default function PublicLayout() {
  const { config } = useSelector((state) => state.tenant);
  const { token } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans">
      
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            {config?.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-slate-950" />
              </div>
            )}
            <div>
              <span className="font-serif text-base font-bold bg-gradient-to-r from-amber-100 to-amber-500 bg-clip-text text-transparent">
                {config?.name || 'Online LMS'}
              </span>
            </div>
          </Link>

          {/* Navigation catalog */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/courses" className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-amber-500 transition">Catalog Khóa học</Link>
            <Link to="/certificates/verify" className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-amber-500 transition">Xác thực văn bằng</Link>
          </nav>

          {/* Auth Button */}
          <div>
            {token ? (
              <Link 
                to="/dashboard"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <span>Đến Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link 
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      {/* Mega Footer */}
      <footer className="bg-[#05080f] border-t border-slate-900/80 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Column 1: Brand & About */}
            <div className="space-y-6">
              <Link to="/" className="flex items-center gap-3">
                {config?.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-slate-950" />
                  </div>
                )}
                <div>
                  <span className="font-serif text-lg font-bold bg-gradient-to-r from-amber-100 to-amber-500 bg-clip-text text-transparent">
                    {config?.name || 'Online LMS'}
                  </span>
                </div>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed">
                Nền tảng học tập trực tuyến hàng đầu, cung cấp các khóa học thực chiến từ các chuyên gia giỏi nhất, giúp bạn bứt phá sự nghiệp.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Khám phá</h4>
              <ul className="space-y-4">
                <li><Link to="/courses" className="text-sm text-slate-400 hover:text-amber-500 transition">Tất cả khóa học</Link></li>
                <li><Link to="/courses?category=lap-trinh" className="text-sm text-slate-400 hover:text-amber-500 transition">Lập trình & CNTT</Link></li>
                <li><Link to="/courses?category=kinh-doanh" className="text-sm text-slate-400 hover:text-amber-500 transition">Kinh doanh & Khởi nghiệp</Link></li>
                <li><Link to="/certificates/verify" className="text-sm text-slate-400 hover:text-amber-500 transition">Xác thực chứng chỉ</Link></li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Hỗ trợ</h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-sm text-slate-400 hover:text-amber-500 transition">Trung tâm trợ giúp (FAQ)</Link></li>
                <li><Link to="/" className="text-sm text-slate-400 hover:text-amber-500 transition">Hướng dẫn thanh toán</Link></li>
                <li><Link to="/" className="text-sm text-slate-400 hover:text-amber-500 transition">Chính sách hoàn tiền</Link></li>
                <li><Link to="/" className="text-sm text-slate-400 hover:text-amber-500 transition">Điều khoản bảo mật</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact & Social */}
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6">Liên hệ</h4>
              <ul className="space-y-4 mb-6">
                <li className="text-sm text-slate-400">Email: support@onlinelms.edu.vn</li>
                <li className="text-sm text-slate-400">Hotline: 1900 1234</li>
                <li className="text-sm text-slate-400">Địa chỉ: Khu công nghệ cao, TP.HCM</li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900/80 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-slate-500 font-mono tracking-wider">
              {config?.name || 'Online LMS'} Platform &copy; 2026. Tất cả các quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold text-slate-400">VNPay</div>
              <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold text-slate-400">VISA</div>
              <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[10px] font-bold text-slate-400">Mastercard</div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
