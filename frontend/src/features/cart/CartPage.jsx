import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trash2, Tag, ShoppingBag, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import { fetchCart, removeFromCart, applyCoupon, clearAppliedCoupon, clearCartError } from './cartSlice';

export default function CartPage({ token }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, totalPrice, appliedCoupon, discountAmount, isLoading, isCartActionLoading, error } = useSelector((state) => state.cart);
  const [couponCode, setCouponCode] = useState('');
  const [localSuccessMsg, setLocalSuccessMsg] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchCart(token));
    }
    return () => {
      dispatch(clearCartError());
    };
  }, [dispatch, token]);

  const handleRemove = (courseId) => {
    dispatch(removeFromCart({ token, courseId }));
    setLocalSuccessMsg('');
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    dispatch(clearCartError());
    setLocalSuccessMsg('');
    
    dispatch(applyCoupon({ token, code: couponCode.toUpperCase().trim() }))
      .unwrap()
      .then((payload) => {
        setLocalSuccessMsg(`Áp dụng mã giảm giá thành công! Giảm ${payload.coupon.discount_percent}% (tối đa ${payload.coupon.max_discount.toLocaleString('vi-VN')} đ)`);
      })
      .catch((err) => {
        // Handled by Redux builder rejecting and setting error state
      });
  };

  const handleRemoveCoupon = () => {
    dispatch(clearAppliedCoupon());
    setCouponCode('');
    setLocalSuccessMsg('');
    dispatch(clearCartError());
  };

  const handleProceedToCheckout = () => {
    navigate('/student/checkout');
  };

  const finalAmount = totalPrice - discountAmount > 0 ? totalPrice - discountAmount : 0;

  return (
    <div className="space-y-6">
      
      {/* Title Board */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 border border-slate-900 p-6 rounded-3xl">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-bold text-slate-100 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            <span>Giỏ hàng chi tiết</span>
          </h1>
          <p className="text-xs text-slate-400">Xem và cập nhật các khóa học đã lựa chọn của bạn trước khi thanh toán.</p>
        </div>
        <button 
          onClick={() => navigate('/courses')}
          className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục chọn học</span>
        </button>
      </div>

      {/* Main Content Layout */}
      {isLoading && items.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="text-xs text-slate-500">Đang đồng bộ thông tin giỏ hàng...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-900 rounded-3xl bg-slate-950/20 space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-350">Không có khóa học nào</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Giỏ hàng của bạn đang trống. Tìm kiếm các khóa học chất lượng trong catalog.</p>
          </div>
          <button 
            onClick={() => navigate('/courses')}
            className="py-2.5 px-5 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-xl transition"
          >
            Quay lại trang Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Items List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Danh sách khóa học ({items.length})
            </h2>

            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="bg-slate-900/10 border border-slate-900/60 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:border-amber-500/10 transition group"
                >
                  <div className="flex gap-4 items-center min-w-0">
                    {/* Simulated thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-850 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-slate-700 group-hover:text-amber-500/60 transition" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-amber-500 transition leading-snug">
                        {item.course?.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">Giảng viên: {item.course?.teacher?.name || 'Giảng viên'}</p>
                      <p className="text-[10px] text-slate-500 max-w-sm line-clamp-1">{item.course?.subtitle || item.course?.description}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-slate-900/60 pt-3 sm:pt-0">
                    <div className="font-mono font-bold text-brand-500 text-sm">
                      {item.course?.price === 0 ? (
                        <span className="text-emerald-500 text-[10px] font-semibold uppercase tracking-wider">Miễn phí</span>
                      ) : (
                        <span>{item.course?.price?.toLocaleString('vi-VN')} đ</span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleRemove(item.course_id)}
                      disabled={isCartActionLoading}
                      className="py-1.5 px-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-slate-900 hover:border-red-950/40 text-[10px] font-semibold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa khỏi giỏ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Summaries & Coupon field */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Tổng quan thanh toán
            </h2>

            <div className="bg-[#0c111e] border border-slate-900 p-6 rounded-2xl space-y-5 shadow-xl">
              <h3 className="font-serif text-sm font-bold text-slate-250 border-b border-slate-900 pb-3">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Giá gốc các khóa học:</span>
                  <span className="font-mono font-bold text-slate-200">{totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-400 bg-emerald-950/10 border border-emerald-950/30 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-[10px]">Mã {appliedCoupon.code} (-{appliedCoupon.discount_percent}%)</span>
                    </div>
                    <span className="font-mono font-bold">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold pt-3 border-t border-slate-900 text-slate-200">
                  <span>Tổng số tiền:</span>
                  <span className="font-mono text-amber-500 text-base">{finalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Coupon inputs Form */}
              <div className="border-t border-slate-900 pt-4 space-y-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Áp dụng mã giảm giá</span>
                </p>

                {error && (
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] flex gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {localSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-[10px] flex gap-1.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{localSuccessMsg}</span>
                  </div>
                )}

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input 
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Mã coupon (ví dụ: LMS10)"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-900 focus:border-amber-500/40 focus:outline-none rounded-lg text-xs placeholder-slate-600 font-semibold tracking-wide uppercase text-slate-200 transition"
                    />
                    <button 
                      type="submit"
                      disabled={isLoading || isCartActionLoading || !couponCode.trim()}
                      className="px-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-900 text-slate-950 disabled:text-slate-500 text-xs font-bold rounded-lg transition border border-transparent disabled:border-slate-850"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Áp dụng'}
                    </button>
                  </form>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs font-bold tracking-wide uppercase text-slate-500 flex items-center justify-between">
                      <span>{appliedCoupon.code}</span>
                      <span className="text-[10px] text-emerald-500 font-semibold">Đang áp dụng</span>
                    </div>
                    <button 
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3.5 bg-slate-900 hover:bg-slate-800 hover:text-red-400 text-slate-400 text-xs font-bold rounded-lg transition border border-slate-850"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                )}
                
                <p className="text-[9px] text-slate-500 leading-normal">
                  * Nhập mã <span className="text-amber-500/80 font-bold font-mono">LMS10</span> để giảm 10% (Tối đa 50K). Nhập mã <span className="text-amber-500/80 font-bold font-mono">GIARE50</span> giảm 50% cho đơn hàng từ 100K trở lên (Tối đa 200K).
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button 
                  onClick={handleProceedToCheckout}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition duration-200"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
