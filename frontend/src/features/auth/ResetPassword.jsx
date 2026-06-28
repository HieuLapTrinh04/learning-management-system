import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { 
  Lock, 
  ArrowRight, 
  GraduationCap, 
  Loader2, 
  CheckCircle2,
  ArrowLeft,
  KeyRound
} from 'lucide-react';

// Zod Schema for validation with password-matching restriction
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Mật khẩu phải có tối thiểu 8 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không trùng khớp',
  path: ['confirmPassword'], // target error indicator
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await axiosClient.post('/api/v1/auth/reset-password', {
        token,
        new_password: data.password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Domain': window.location.hostname
        }
      });
      const resData = response.data;
      setSuccessMsg('Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] px-4 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-slate-950">
      
      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -z-10 top-1/4 left-1/3"></div>

      <div className="max-w-md w-full space-y-8 bg-slate-900/40 p-8 rounded-3xl border border-slate-900 backdrop-blur-xl shadow-2xl relative">
        
        {/* Decorative gold ornaments */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/30"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/30"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/30"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/30"></div>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-600/30">
            <GraduationCap className="h-7 w-7 text-slate-950" />
          </div>
          <h2 className="mt-6 font-serif text-3xl font-bold text-slate-100">Thiết Lập Mật Khẩu</h2>
          <p className="mt-2 text-xs text-slate-400">Tạo mật khẩu đăng nhập mới có độ bảo mật cao</p>
        </div>

        {!token ? (
           <div className="text-center text-red-500 mt-4 text-sm font-semibold p-4 rounded-xl bg-red-950/30 border border-red-900/50">
             Không tìm thấy mã xác nhận (token) trên đường dẫn. Hãy kiểm tra lại liên kết trong email.
           </div>
        ) : successMsg ? (
          <div className="space-y-6 py-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex gap-3 items-start animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
            
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl transition"
            >
              <span>Đi tới Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs text-center animate-fade-in">
                {errorMsg}
              </div>
            )}
            
            {/* New Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Mật khẩu mới</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-4 py-3 bg-[#0c101a] border ${errors.password ? 'border-red-900/50 focus:border-red-500' : 'border-slate-800/80 focus:border-amber-500/50'} rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-sm transition`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <span className="text-red-500 text-[11px] mt-1.5 block">{errors.password.message}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-4 py-3 bg-[#0c101a] border ${errors.confirmPassword ? 'border-red-900/50 focus:border-red-500' : 'border-slate-800/80 focus:border-amber-500/50'} rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-sm transition`}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-red-500 text-[11px] mt-1.5 block">{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl transition duration-350 shadow-lg shadow-amber-500/10 focus:outline-none"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1">
                    Cập nhật mật khẩu <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent hover:bg-slate-900/40 text-slate-450 font-semibold rounded-xl transition text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Hủy và quay lại</span>
              </Link>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
