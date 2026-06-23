import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert } from 'lucide-react';

export default function RoleProtectedRoute({ allowedRoles }) {
  const role = useSelector((state) => state.auth.role);

  if (!role || !allowedRoles.includes(role)) {
    // Return a clean premium 403 Access Denied block
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] px-4 selection:bg-brand-500 selection:text-slate-950">
        <div className="max-w-md w-full text-center bg-slate-900/50 p-8 rounded-3xl border border-slate-900 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-500 mx-auto mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-slate-100 mb-2">Truy Cập Bị Từ Chối</h1>
          <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
            Tài khoản của bạn có vai trò <span className="font-mono text-red-400 uppercase font-semibold">[{role || "guest"}]</span>, không đủ điều kiện phân quyền để truy xuất mục này.
          </p>

          <div className="mt-8 flex gap-3 justify-center">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Quay lại trang trước
            </button>
            <Link 
              to="/dashboard"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
