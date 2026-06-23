import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyCertificate, clearVerifiedCertificate } from './certificateSlice';
import { Search, ShieldCheck, ShieldAlert, Award, Calendar, User, BookOpen, Download, RefreshCw, Loader2, ArrowRight } from 'lucide-react';

export default function CertificateVerifier() {
  const dispatch = useDispatch();
  const { verifiedCert, isVerifying, verifyError } = useSelector((state) => state.certificate);

  const [code, setCode] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    dispatch(verifyCertificate(code.trim().toUpperCase()));
  };

  const handleReset = () => {
    setCode('');
    dispatch(clearVerifiedCertificate());
  };

  return (
    <div className="max-w-xl w-full mx-auto space-y-6 pb-16">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-100">Xác Thực Chứng Chỉ Công Khai</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Nhập mã số định danh chứng chỉ tốt nghiệp (ví dụ: LMS-CERT-1-1-XXXX) để kiểm tra tính hợp lệ trực tiếp từ hệ thống.
        </p>
      </div>

      {!verifiedCert ? (
        /* Code Input Form */
        <div className="bg-slate-900/50 border border-slate-900 shadow-2xl rounded-3xl p-6 md:p-8 backdrop-blur-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -z-10"></div>
          
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Mã định danh chứng chỉ</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="LMS-CERT-X-X-XXXXXXXX"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-660 focus:outline-none focus:border-amber-500/50 text-xs font-mono uppercase tracking-widest transition"
                  required
                />
              </div>
            </div>

            {verifyError && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Xác thực thất bại</p>
                  <p>{verifyError}</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isVerifying || !code.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 disabled:from-slate-800 disabled:to-slate-900 text-slate-950 disabled:text-slate-500 font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 text-xs"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang truy xuất thông tin...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Xác minh chứng chỉ</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Verified Details Receipt Card */
        <div className="bg-slate-900/50 border border-slate-900 shadow-2xl rounded-3xl p-6 md:p-8 backdrop-blur-lg relative overflow-hidden animate-scaleIn">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              ✓ Chứng chỉ hợp lệ
            </span>
            <p className="text-[10px] font-mono text-slate-550 mt-3">MÃ GD: {verifiedCert.certificate_code}</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4 mb-6">
            <div className="flex items-start gap-3 text-xs pb-3.5 border-b border-slate-900">
              <User className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block">Học viên được cấp:</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{verifiedCert.student_name}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-xs pb-3.5 border-b border-slate-900">
              <BookOpen className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block">Tốt nghiệp khóa học:</span>
                <span className="font-semibold text-slate-250 mt-0.5 block leading-relaxed">{verifiedCert.course_title}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <Calendar className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-500 block">Thời gian cấp chứng chỉ:</span>
                <span className="font-semibold text-slate-350 mt-0.5 block">
                  {new Date(verifiedCert.issued_at).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href={verifiedCert.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Tải xuống tệp PDF gốc</span>
            </a>
            
            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition duration-200"
            >
              <span>Xác minh chứng chỉ khác</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
