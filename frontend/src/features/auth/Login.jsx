import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, loginSandbox } from './authSlice';
import {
  Mail,
  Lock,
  ArrowRight,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react';

// Zod Schema for validation
const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có tối thiểu 8 ký tự'),
});

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error: reduxError } = useSelector((state) => state.auth);

  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isLoading = status === 'loading';

  // Sync redux errors to local notification state
  useEffect(() => {
    if (reduxError) {
      setApiError(reduxError);
    }
  }, [reduxError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setApiError('');
    setSuccessMsg('');

    const resultAction = await dispatch(loginUser({ email: data.email, password: data.password }));

    if (loginUser.fulfilled.match(resultAction)) {
      setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
      const { token, role, userId, userName } = resultAction.payload;

      if (onLoginSuccess) {
        onLoginSuccess(token, role, userId, userName);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  const handlePredefinedLogin = async (selectedRole) => {
    setApiError('');
    setSuccessMsg('');

    const resultAction = await dispatch(loginSandbox(selectedRole));

    if (loginSandbox.fulfilled.match(resultAction)) {
      setSuccessMsg(`Đăng nhập Sandbox (${selectedRole}) thành công! Đang chuyển hướng...`);
      const { token, role, userId, userName } = resultAction.payload;

      if (onLoginSuccess) {
        onLoginSuccess(token, role, userId, userName);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 py-8 md:py-16">

      {/* Background radial glow */}
      <div className="hidden md:block absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] -z-10 top-1/4 left-1/3"></div>
      <div className="hidden md:block absolute w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] -z-10 bottom-1/4 right-1/4"></div>

      <div className="max-w-md w-full space-y-4 md:space-y-8 bg-slate-900/60 p-5 md:p-8 rounded-3xl border border-amber-500/20 backdrop-blur-2xl shadow-[0_0_40px_rgba(245,158,11,0.1)] relative">

        {/* Decorative corner gold highlights */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/30"></div>
        <div className="absolute top-0 sm:-top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/30"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/30"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/30"></div>

        <div className="text-center">
          <div className="mx-auto h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-600/30">
            <GraduationCap className="h-6 w-6 md:h-7 md:w-7 text-slate-950" />
          </div>
          <h2 className="mt-4 md:mt-6 font-serif text-xl md:text-3xl font-bold text-slate-100">Chào Mừng Quay Lại</h2>
          <p className="mt-1 md:mt-2 text-[10px] md:text-xs text-slate-400">Đăng nhập tài khoản của bạn để truy cập học liệu</p>
        </div>

        {/* Global API Alerts */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2.5 items-start">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{typeof apiError === 'object' ? apiError.message : apiError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex gap-2.5 items-start">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        <form className="mt-6 md:mt-8 space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Địa chỉ Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="student@lms.edu.vn"
                  className={`block w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-950/50 border ${errors.email ? 'border-red-900/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' : 'border-slate-800/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'} rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-xs md:text-sm transition shadow-inner`}
                  {...register('email')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <span className="text-red-500 text-[11px] mt-1.5 block">{errors.email.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 transition"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-950/50 border ${errors.password ? 'border-red-900/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' : 'border-slate-800/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'} rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-xs md:text-sm transition shadow-inner`}
                  {...register('password')}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <span className="text-red-500 text-[11px] mt-1.5 block">{errors.password.message}</span>
              )}
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 md:py-3 px-4 border border-transparent rounded-xl text-xs md:text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-slate-900 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  Đăng nhập <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-semibold text-amber-500 hover:text-amber-400 transition"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>


      </div>
    </div>
  );
}
