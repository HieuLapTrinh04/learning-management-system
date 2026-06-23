import React from 'react';
import { CheckCircle2, XCircle, DollarSign, Receipt, ArrowRight, BookOpen, ShieldAlert } from 'lucide-react';

export default function PaymentResult({ queryParams, onNavigate }) {
  const responseCode = queryParams.vnp_ResponseCode || '';
  const txnRef = queryParams.vnp_TxnRef || 'N/A';
  const amountStr = queryParams.vnp_Amount || '0';
  const bankCode = queryParams.vnp_BankCode || 'N/A';
  const rawPayDate = queryParams.vnp_PayDate || ''; // YYYYMMDDHHmmss

  const isSuccess = responseCode === '00';

  // Format amount (VNPay amount is multiplied by 100)
  const formatAmountVND = (amountStr) => {
    const rawVal = parseInt(amountStr, 10);
    if (isNaN(rawVal)) return '0đ';
    const amountVND = Math.floor(rawVal / 100);
    return amountVND.toLocaleString('vi-VN') + ' đ';
  };

  // Format payment date (e.g. 20260618113229 -> 11:32:29 18/06/2026)
  const formatPayDate = (dateStr) => {
    if (!dateStr || dateStr.length < 14) return 'N/A';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const min = dateStr.substring(10, 12);
    const sec = dateStr.substring(12, 14);
    return `${hour}:${min}:${sec} - ${day}/${month}/${year}`;
  };

  return (
    <div className="max-w-md w-full mx-auto bg-slate-900/50 border border-slate-900 shadow-2xl rounded-3xl p-6 md:p-8 backdrop-blur-lg relative overflow-hidden mt-6">
      {/* Decorative glows */}
      <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl -z-10 ${isSuccess ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}></div>
      <div className={`absolute bottom-0 left-0 w-36 h-36 rounded-full blur-3xl -z-10 ${isSuccess ? 'bg-teal-500/5' : 'bg-orange-500/5'}`}></div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-100">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          {isSuccess 
            ? 'Cảm ơn bạn đã đăng ký học tại Online LMS. Hệ thống đang đồng bộ và mở quyền truy cập bài học.'
            : 'Giao dịch không thành công hoặc đã bị hủy từ phía ngân hàng của bạn.'}
        </p>
      </div>

      {/* Transaction info panel */}
      <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 space-y-4 mb-8">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-900">
          <span className="text-slate-500 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-amber-500" /> Mã giao dịch:</span>
          <span className="font-mono font-semibold text-slate-300">{txnRef}</span>
        </div>
        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-900">
          <span className="text-slate-500 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-amber-500" /> Tổng tiền:</span>
          <span className="font-mono font-bold text-amber-500 text-sm">{formatAmountVND(amountStr)}</span>
        </div>
        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-900">
          <span className="text-slate-500">Ngân hàng thanh toán:</span>
          <span className="font-semibold text-slate-300 uppercase">{bankCode}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Thời gian thực hiện:</span>
          <span className="font-semibold text-slate-300">{formatPayDate(rawPayDate)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {isSuccess ? (
          <button
            onClick={() => onNavigate('my-courses')}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition duration-200"
          >
            <BookOpen className="w-4 h-4 text-slate-950" />
            <span>Vào lớp học ngay</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('catalog')}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition duration-200"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Xem lại danh mục khóa học</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition duration-200"
        >
          <span>Quay lại trang cá nhân</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
