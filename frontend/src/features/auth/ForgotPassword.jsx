import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  ArrowRight, 
  GraduationCap, 
  Loader2, 
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

// Zod Schema for validation
const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data) => {
    setSuccessMsg('');
    try {
      await window.fetch('http://localhost:8080/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });
      setSuccessMsg(`Đã gửi liên kết khôi phục thành công tới email ${data.email}. Vui lòng kiểm tra hộp thư đến.`);
    } catch (err) {
      console.error(err);
      setSuccessMsg('Có lỗi xảy ra. Vui lòng thử lại sau.');
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
          <h2 className="mt-6 font-serif text-3xl font-bold text-slate-100">Quên Mật Khẩu?</h2>
          <p className="mt-2 text-xs text-slate-400">Nhập email đăng ký để nhận liên kết khôi phục quyền truy cập</p>
        </div>

        {successMsg ? (
          <div className="space-y-6 py-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex gap-3 items-start animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
            
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Đăng nhập</span>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Địa chỉ Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-600">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="name@lms.edu.vn"
                  className={`block w-full pl-10 pr-4 py-3 bg-[#0c101a] border ${errors.email ? 'border-red-900/50 focus:border-red-500' : 'border-slate-800/80 focus:border-amber-500/50'} rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-sm transition`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span className="text-red-500 text-[11px] mt-1.5 block">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl transition duration-350 shadow-lg shadow-amber-500/10 focus:outline-none"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1">
                    Gửi yêu cầu khôi phục <ArrowRight className="h-4 w-4" />
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
