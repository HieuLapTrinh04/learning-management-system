import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader2, AlertCircle, ShoppingBag, ShieldCheck, CheckSquare, Sparkles } from 'lucide-react';
import { fetchCart, checkoutCart, resetCheckoutUrl, clearCartError, clearCartState } from './cartSlice';

export default function CheckoutPage({ token }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, totalPrice, appliedCoupon, discountAmount, checkoutUrl, isLoading, error } = useSelector((state) => state.cart);

  useEffect(() => {
    if (token) {
      dispatch(fetchCart(token));
    }
    return () => {
      dispatch(clearCartError());
      dispatch(resetCheckoutUrl());
    };
  }, [dispatch, token]);

  // Handle redirect to VNPay when checkoutUrl changes
  useEffect(() => {
    if (checkoutUrl) {
      dispatch(clearCartState()); // Clear cart state locally
      
      // Auto redirect based on environment
      if (import.meta.env.MODE === 'development') {
        const urlObj = new URL(checkoutUrl);
        const searchParams = urlObj.search;
        navigate(`/student/checkout/vnpay-mock${searchParams}`);
      } else {
        // In production, redirect directly to real VNPay payment gateway
        window.location.href = checkoutUrl;
      }
    }
  }, [checkoutUrl, dispatch, navigate]);

  const handleCheckout = () => {
    dispatch(checkoutCart({ 
      token, 
      couponCode: appliedCoupon ? appliedCoupon.code : '' 
    }));
  };

  const finalAmount = totalPrice - discountAmount > 0 ? totalPrice - discountAmount : 0;

  if (isLoading && items.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang chuẩn bị thông tin thanh toán...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-slate-900 rounded-3xl bg-slate-950/20 space-y-4 max-w-xl mx-auto my-10">
        <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-350">Không thể thanh toán</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">Giỏ hàng của bạn đang trống hoặc đơn hàng đã được khởi tạo trước đó.</p>
        </div>
        <button 
          onClick={() => navigate('/courses')}
          className="py-2.5 px-5 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-xl transition"
        >
          Khám phá khóa học
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Back button */}
      <div>
        <button 
          onClick={() => navigate('/student/cart')}
          className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Giỏ hàng</span>
        </button>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
        <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center justify-center gap-3">
          <CreditCard className="w-7 h-7 text-amber-500" />
          <span>Xác Nhận Đơn Hàng</span>
        </h1>
        <p className="text-xs text-slate-400">
          Vui lòng kiểm tra lại danh sách các khóa học và thực hiện thanh toán trực tuyến an toàn.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-xs flex gap-3 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Lỗi khởi tạo thanh toán</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Grid Checkout content */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Left Column: Confirmation list */}
        <div className="md:col-span-3 space-y-5">
          <div className="bg-[#0c111e] border border-slate-900/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-900 pb-2">
              Khóa học sẽ mua ({items.length})
            </h3>
            
            <div className="divide-y divide-slate-900">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <CheckSquare className="w-4 h-4 text-amber-500/70" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 leading-snug">{item.course?.title}</h4>
                      <p className="text-[9px] text-slate-500">GV: {item.course?.teacher?.name || 'Giảng viên'}</p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-brand-500 text-xs flex-shrink-0">
                    {item.course?.price === 0 ? 'Miễn phí' : `${item.course?.price?.toLocaleString('vi-VN')} đ`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/10 border border-slate-900/60 p-5 rounded-2xl flex gap-3.5 items-start">
            <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-250">Giao dịch trực tuyến bảo mật</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Hệ thống sử dụng cổng thanh toán VNPay chính thức. Thông tin thẻ ngân hàng hoặc ví của bạn được bảo mật tuyệt đối theo tiêu chuẩn PCI DSS quốc tế.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Billing & Method selection */}
        <div className="md:col-span-2 space-y-5">
          
          {/* Method section */}
          <div className="bg-[#0c111e] border border-slate-900/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-900 pb-2">
              Phương thức thanh toán
            </h3>
            
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Cổng VNPay</h4>
                  <p className="text-[9px] text-slate-400">Thẻ ATM / QR Code / Ví điện tử</p>
                </div>
              </div>
              <div className="w-3.5 h-3.5 rounded-full border-4 border-amber-500 bg-slate-950"></div>
            </div>
          </div>

          {/* Pricing detail */}
          <div className="bg-[#0c111e] border border-slate-900/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-900 pb-2">
              Chi tiết hóa đơn
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Tổng giá trị gốc:</span>
                <span className="font-mono text-slate-200">{totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-400 font-semibold">
                  <span>Mã {appliedCoupon.code} ({appliedCoupon.discount_percent}%):</span>
                  <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-bold pt-2.5 border-t border-slate-900 text-slate-200">
                <span>Tổng số tiền cần thanh toán:</span>
                <span className="font-mono text-amber-500 text-sm">{finalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 disabled:from-slate-900 disabled:to-slate-900 text-slate-950 disabled:text-slate-500 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Đang khởi tạo liên kết...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Thanh toán ngay qua VNPay</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
