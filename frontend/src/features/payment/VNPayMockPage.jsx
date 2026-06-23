import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

export default function VNPayMockPage({ token }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract VNPay variables from query params
  const txnRef = searchParams.get('vnp_TxnRef') || '';
  const rawAmount = searchParams.get('vnp_Amount') || '0';
  const orderInfo = searchParams.get('vnp_OrderInfo') || '';

  // Actual amount is rawAmount / 100
  const amount = Math.floor(parseInt(rawAmount, 10) / 100);

  // States
  const [copiedField, setCopiedField] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!txnRef) return;
    setIsConfirming(true);
    setError('');

    try {
      const response = await axios.post('/api/v1/student/payments/mock-success', {
        txn_ref: txnRef
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Construct paydate in format YYYYMMDDHHmmss
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const sec = now.getSeconds().toString().padStart(2, '0');
        const payDate = `${year}${month}${day}${hour}${min}${sec}`;

        // Redirect to standard payment success screen
        navigate(`/student/payment-result?vnp_ResponseCode=00&vnp_TxnRef=${txnRef}&vnp_Amount=${rawAmount}&vnp_BankCode=TECHCOMBANK&vnp_PayDate=${payDate}`);
      } else {
        setError(response.data.message || 'Xác nhận giao dịch thất bại.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelPayment = () => {
    navigate('/student/cart');
  };

  // Generate dynamic VietQR image URL
  const qrUrl = `https://img.vietqr.io/image/techcombank-0567197354-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(txnRef)}&accountName=Bui%20Minh%20Hieu`;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold">
          <CreditCard className="w-3.5 h-3.5" />
          <span>VNPay Bank Transfer Integration</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-slate-100">
          Cổng Thanh Toán VNPay
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để thanh toán học phí. Hệ thống sẽ tự động cập nhật ngay khi được xác nhận.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs flex gap-3 max-w-xl mx-auto">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        
        {/* QR Section */}
        <div className="md:col-span-2 bg-[#0c111e] border border-slate-900 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
          <div className="relative group p-3 bg-white rounded-xl shadow-lg">
            <img 
              src={qrUrl} 
              alt="Mã QR thanh toán Techcombank"
              className="w-48 h-48 md:w-56 md:h-56 object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300">
              <QrCode className="w-8 h-8 text-amber-500" />
              <span className="text-[10px] text-slate-350 ml-1.5 font-bold">Mã QR chính thức</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] text-slate-455 font-mono uppercase tracking-wider block">Quét để thanh toán</span>
            <p className="text-xs text-slate-400 leading-normal">
              Mở ứng dụng Mobile Banking của bạn, chọn quét QR và hướng camera vào mã phía trên.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-450 border border-slate-900 rounded-xl px-3 py-1.5 bg-slate-950/40">
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Mã QR hết hạn sau:</span>
            <span className="font-mono font-bold text-amber-500">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Transfer Info details & Activation */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-[#0c111e] border border-slate-900 p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-900 pb-2">
              Thông tin chuyển khoản ngân hàng
            </h3>

            <div className="space-y-3.5">
              {/* Bank */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-slate-200">Techcombank (TCB)</span>
              </div>

              {/* Account Number */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200">0567197354</span>
                  <button 
                    onClick={() => handleCopy('0567197354', 'acc')}
                    className="p-1 hover:bg-slate-900 rounded text-slate-455 hover:text-slate-250 transition"
                    title="Sao chép"
                  >
                    {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Owner */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Tên chủ tài khoản:</span>
                <span className="font-bold text-slate-200">BUI MINH HIEU</span>
              </div>

              {/* Amount */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tiền chuyển khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-500 text-sm">{amount.toLocaleString('vi-VN')} đ</span>
                  <button 
                    onClick={() => handleCopy(amount.toString(), 'amount')}
                    className="p-1 hover:bg-slate-900 rounded text-slate-455 hover:text-slate-250 transition"
                    title="Sao chép"
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Message */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Nội dung chuyển khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-900">{txnRef}</span>
                  <button 
                    onClick={() => handleCopy(txnRef, 'msg')}
                    className="p-1 hover:bg-slate-900 rounded text-slate-455 hover:text-slate-250 transition"
                    title="Sao chép"
                  >
                    {copiedField === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-900 flex gap-2 items-start text-[10px] text-slate-500 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                Vui lòng chuyển chính xác số tiền và nhập đúng nội dung chuyển khoản để hệ thống tự động duyệt bài học ngay lập tức.
              </span>
            </div>
          </div>

          {/* Action portals */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirmPayment}
              disabled={isConfirming || timeLeft <= 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 disabled:from-slate-900 disabled:to-slate-900 text-slate-950 disabled:text-slate-550 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang xác nhận giao dịch...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận đã chuyển khoản</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>

            <button
              onClick={handleCancelPayment}
              disabled={isConfirming}
              className="py-3 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <X className="w-4 h-4" />
              <span>Hủy giao dịch</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
