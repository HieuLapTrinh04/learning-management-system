import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Trash2, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { fetchCart, removeFromCart } from './cartSlice';

export default function CartSidebar({ isOpen, onClose, token }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { items, totalPrice, isLoading, isCartActionLoading } = useSelector((state) => state.cart);

  useEffect(() => {
    if (isOpen && token) {
      dispatch(fetchCart(token));
    }
  }, [dispatch, isOpen, token]);

  const handleRemove = (courseId) => {
    dispatch(removeFromCart({ token, courseId }));
  };

  const handleNavigateToCart = () => {
    onClose();
    navigate('/student/cart');
  };

  const handleNavigateToCheckout = () => {
    onClose();
    navigate('/student/checkout');
  };

  const handleBrowseCourses = () => {
    onClose();
    navigate('/courses');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
      ></div>

      {/* Sidebar Drawer */}
      <div className="relative w-full max-w-md h-full bg-[#0c111e] border-l border-slate-900 shadow-2xl flex flex-col justify-between z-10 animate-slide-in">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-900/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <ShoppingBag className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-slate-200">Giỏ hàng của bạn</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{items.length} khóa học được chọn</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 flex items-center justify-center transition border border-transparent hover:border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading && items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="text-xs">Đang tải giỏ hàng...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-10">
              <div className="w-14 h-14 rounded-full bg-slate-900/40 border border-slate-850 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">Giỏ hàng đang trống</p>
                <p className="text-[10px] text-slate-500 max-w-[200px]">Hãy khám phá hàng trăm khóa học hấp dẫn để bắt đầu học.</p>
              </div>
              <button 
                onClick={handleBrowseCourses}
                className="mt-2 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
              >
                Khám phá khóa học
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="bg-slate-900/20 border border-slate-900/60 p-3.5 rounded-xl flex gap-3 items-center justify-between group hover:border-amber-500/10 transition"
                >
                  <div className="flex gap-3 items-center min-w-0">
                    {/* Thumbnail mock */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-850 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-slate-700 group-hover:text-amber-500/60 transition" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1 leading-snug group-hover:text-amber-500 transition">
                        {item.course?.title}
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">GV: {item.course?.teacher?.name || 'Giảng viên'}</p>
                      <p className="text-[11px] font-mono font-bold text-brand-500 mt-1">
                        {item.course?.price === 0 ? (
                          <span className="text-emerald-500 font-semibold text-[9px] uppercase tracking-wider">Miễn phí</span>
                        ) : (
                          <span>{item.course?.price?.toLocaleString('vi-VN')} đ</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemove(item.course_id)}
                    disabled={isCartActionLoading}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-950/40 transition flex-shrink-0"
                    title="Xóa khỏi giỏ hàng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-900 bg-slate-950/50 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Tổng tạm tính:</span>
              <span className="text-base font-bold font-mono text-amber-500">{totalPrice.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleNavigateToCart}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition duration-200 text-center"
              >
                Xem chi tiết
              </button>
              <button 
                onClick={handleNavigateToCheckout}
                className="py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition duration-200 text-center"
              >
                <span>Thanh toán</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
