import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2, Calendar, Loader2, AlertCircle, Search, HelpCircle, X, CheckCircle, BookOpen, Edit2 } from 'lucide-react';
import { fetchCoupons, createCoupon, updateCoupon, toggleCouponStatus, expireCoupon, clearCouponError } from './couponSlice';
import axios from 'axios';

export default function CouponManager({ token, role = 'admin' }) {
  const dispatch = useDispatch();
  const { coupons, totalCoupons, currentPage, limitCoupons, isLoading, isActionLoading, error } = useSelector((state) => state.coupon);

  const [searchVal, setSearchVal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState([]);

  // Form states
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('0');
  const [scope, setScope] = useState('global');
  const [courseId, setCourseId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('0');
  const [userLimit, setUserLimit] = useState('1');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchCoupons({ token, page: currentPage, search: searchVal, role }));
    }
  }, [dispatch, token, currentPage, role]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchCoupons({ token, page: 1, search: searchVal, role }));
  };

  const handlePageChange = (page) => {
    dispatch(fetchCoupons({ token, page, search: searchVal, role }));
  };

  useEffect(() => {
    if (showModal) {
      const endpoint = role === 'teacher' ? '/api/v1/teacher/courses' : '/api/v1/courses';
      const config = role === 'teacher' && token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      axios.get(endpoint, config)
        .then(res => {
          const courseData = res.data?.data || res.data || [];
          setCourses(Array.isArray(courseData) ? courseData : []);
        })
        .catch(err => console.error('Failed to load courses for selection', err));
    }
  }, [showModal, role, token]);

  const handleToggle = (id, currentStatus) => {
    dispatch(toggleCouponStatus({ token, id, isActive: !currentStatus, role }));
  };

  const handleExpire = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn cho mã giảm giá này hết hạn ngay lập tức? Hành động này không thể hoàn tác.')) {
      dispatch(expireCoupon({ token, id, role }));
    }
  };

  const handleEditClick = (coupon) => {
    setEditingCouponId(coupon.id);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value.toString());
    setMinOrderAmount(coupon.min_order_amount.toString());
    setMaxDiscount(coupon.max_discount.toString());
    setScope(coupon.scope);
    setCourseId(coupon.course_id ? coupon.course_id.toString() : '');
    setExpiryDate(coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '');
    setUsageLimit(coupon.usage_limit.toString());
    setUserLimit(coupon.user_limit.toString());
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim()) {
      setFormError('Mã coupon không được để trống');
      return;
    }
    if (Number(discountValue) <= 0) {
      setFormError('Giá trị giảm giá phải lớn hơn 0');
      return;
    }
    if (discountType === 'percentage' && Number(discountValue) > 100) {
      setFormError('Phần trăm giảm giá tối đa là 100%');
      return;
    }
    if (scope === 'course' && !courseId) {
      setFormError('Phải chọn khóa học cụ thể áp dụng');
      return;
    }
    if (!expiryDate) {
      setFormError('Vui lòng chọn ngày hết hạn');
      return;
    }

    const newCoupon = {
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_amount: parseFloat(minOrderAmount) || 0,
      max_discount: parseFloat(maxDiscount) || 0,
      scope: scope,
      course_id: scope === 'course' ? Number(courseId) : null,
      expiry_date: new Date(expiryDate).toISOString(),
      usage_limit: parseInt(usageLimit) || 0,
      user_limit: parseInt(userLimit) || 1,
    };

    if (editingCouponId) {
      dispatch(updateCoupon({ token, id: editingCouponId, coupon: newCoupon, role }))
        .unwrap()
        .then(() => {
          setShowModal(false);
          resetForm();
        })
        .catch((err) => {
          setFormError(err || 'Không thể cập nhật mã giảm giá');
        });
    } else {
      dispatch(createCoupon({ token, coupon: newCoupon, role }))
        .unwrap()
        .then(() => {
          setShowModal(false);
          resetForm();
        })
        .catch((err) => {
          setFormError(err || 'Không thể tạo mã giảm giá');
        });
    }
  };

  const resetForm = () => {
    setEditingCouponId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('0');
    setMaxDiscount('0');
    setScope('global');
    setCourseId('');
    setExpiryDate('');
    setUsageLimit('0');
    setUserLimit('1');
    setFormError('');
  };

  const isExpired = (expiryStr) => {
    return new Date().getTime() > new Date(expiryStr).getTime();
  };

  return (
    <div className="space-y-6">
      
      {/* Title Board */}
      <div className="flex flex-row justify-between items-center gap-2 md:gap-4 bg-slate-900/20 border border-slate-900 p-3 md:p-6 rounded-xl md:rounded-3xl">
        <div className="min-w-0">
          <h1 className="font-serif text-sm md:text-2xl font-bold text-slate-100 flex items-center gap-2 md:gap-3 truncate">
            <Tag className="w-5 h-5 md:w-7 md:h-7 text-amber-500 flex-shrink-0" />
            <span className="truncate">Quản Lý Mã Giảm Giá</span>
          </h1>
          <p className="text-[9px] md:text-xs text-slate-400 mt-1 md:mt-1.5 truncate">Xem, tạo mới, cấu hình mã coupon, voucher.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="p-2 md:py-2.5 md:px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition duration-200 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-950" />
          <span className="hidden md:inline">Tạo mã mới</span>
        </button>
      </div>

      {/* Search box & Summary */}
      <div className="bg-slate-900/30 border border-slate-900 p-3 md:p-5 rounded-xl md:rounded-3xl flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center text-slate-500">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm kiếm mã coupon (ví dụ: LMS10)..."
            className="block w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-2 sm:py-2.5 bg-[#0c101a] border border-slate-850 focus:border-amber-500/50 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none text-[10px] sm:text-xs transition"
          />
          <button 
            type="submit" 
            className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 px-2 sm:px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[9px] sm:text-[10px] font-bold rounded-lg border border-slate-800"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-mono">
          Tổng cộng: <span className="text-amber-500 font-bold">{totalCoupons}</span> mã giảm giá
        </div>
      </div>

      {/* Main Table Coupon List */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex gap-3 max-w-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && coupons.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="text-xs text-slate-500">Đang tải danh sách coupon...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-10 md:py-20 px-4 text-[10px] md:text-xs text-slate-500 border border-dashed border-slate-900 rounded-xl md:rounded-3xl bg-slate-950/10">
          Chưa có mã giảm giá nào được tạo. Nhấp "Tạo mã mới" để bắt đầu cấu hình.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/40">
            <table className="w-full text-left border-collapse min-w-[650px] sm:min-w-max">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 text-[9px] sm:text-[10px] uppercase font-mono tracking-wider">
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Mã code</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Hình thức giảm giá</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Giá trị giảm</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Phạm vi áp dụng</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Hạn sử dụng</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Lượt dùng</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Trạng thái</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900/60">
                {coupons.map((c) => {
                  const expired = isExpired(c.expiry_date);
                  return (
                    <tr key={c.id} className="hover:bg-slate-900/10 transition">
                      <td className="px-2 py-1.5 sm:p-4 font-bold font-mono text-amber-500 uppercase tracking-wide">
                        {c.code}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[100px]">
                        {c.discount_type === 'percentage' ? (
                          <span className="text-slate-300">Phần trăm (%)</span>
                        ) : (
                          <span className="text-slate-300">Số tiền cố định (đ)</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 font-semibold text-slate-200 min-w-[120px]">
                        {c.discount_type === 'percentage' ? (
                          <span>{c.discount_value}% <span className="hidden sm:inline">(Tối đa {c.max_discount.toLocaleString('vi-VN')} đ)</span></span>
                        ) : (
                          <span>{c.discount_value.toLocaleString('vi-VN')} đ</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[140px] sm:min-w-[200px]">
                        {c.scope === 'global' ? (
                          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Toàn hệ thống</span>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/20 px-2 py-0.5 rounded">Khóa học cụ thể</span>
                            <span className="block text-[9px] text-slate-500 font-semibold line-clamp-1 mt-0.5">{c.course?.title}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[100px] sm:min-w-[140px]">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-slate-400 text-[9px] sm:text-xs">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span>{new Date(c.expiry_date).toLocaleDateString('vi-VN')}</span>
                          {expired && (
                            <span className="text-[7px] sm:text-[8px] uppercase font-bold text-red-500 bg-red-950/10 border border-red-900/20 px-1 py-0.5 rounded ml-1 whitespace-nowrap">Hết hạn</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 font-semibold text-slate-300 text-[9px] sm:text-xs min-w-[100px] sm:min-w-[150px]">
                        <div className="whitespace-nowrap">
                          {c.used_count} / {c.usage_limit > 0 ? c.usage_limit : '∞'}
                        </div>
                        <div className="text-[7px] sm:text-[8px] text-slate-500 font-semibold mt-0.5 whitespace-nowrap">Giới hạn {c.user_limit} lần/user</div>
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[60px] sm:min-w-[100px]">
                        <button 
                          onClick={() => handleToggle(c.id, c.is_active)}
                          disabled={isActionLoading}
                          className="flex items-center gap-1 hover:opacity-80 transition scale-75 origin-left sm:scale-100"
                        >
                          {c.is_active ? (
                            <>
                              <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0" />
                              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400">Bật</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 flex-shrink-0" />
                              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">Tắt</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-2 sm:p-4 text-right flex justify-end gap-1 sm:gap-2 items-center min-w-[100px] sm:min-w-[140px]">
                        <button 
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 sm:py-1.5 sm:px-2 bg-slate-950/30 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-500 rounded-lg transition"
                          title="Sửa mã"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!expired && c.is_active && (
                          <button 
                            onClick={() => handleExpire(c.id)}
                            disabled={isActionLoading}
                            className="py-1 px-1.5 sm:py-1 sm:px-2.5 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 text-[9px] sm:text-[10px] font-bold rounded-lg transition whitespace-nowrap"
                          >
                            Hết hạn
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalCoupons > limitCoupons && (
            <div className="flex justify-between items-center text-xs pt-3">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-bold rounded-lg border border-slate-800 transition"
              >
                Trước
              </button>
              <span className="text-slate-400">Trang <span className="text-amber-500 font-bold">{currentPage}</span> / {Math.ceil(totalCoupons / limitCoupons)}</span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCoupons / limitCoupons) || isLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 font-bold rounded-lg border border-slate-800 transition"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-[320px] md:max-w-lg bg-[#0c111e] border border-slate-900 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-900/80 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-sm font-bold text-slate-200">{editingCouponId ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-[10px] flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mã Code Coupon</label>
                <input 
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ví dụ: GIANGMAI20, BLACKFRIDAY"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 placeholder-slate-650 focus:outline-none uppercase font-mono tracking-wider focus:border-amber-500/40 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Discount Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Loại giảm giá</label>
                  <select 
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-400 focus:outline-none focus:border-amber-500/40 transition"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {discountType === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)'}
                  </label>
                  <input 
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'ví dụ: 10' : 'ví dụ: 50000'}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Purchase */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đơn hàng tối thiểu (đ)</label>
                  <input 
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 transition"
                  />
                </div>

                {/* Max Discount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mức giảm tối đa (đ)</label>
                  <input 
                    type="number"
                    disabled={discountType === 'fixed'}
                    value={discountType === 'fixed' ? '0' : maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 disabled:opacity-40 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Scope */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phạm vi</label>
                  <select 
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-400 focus:outline-none focus:border-amber-500/40 transition"
                  >
                    <option value="global">Toàn hệ thống</option>
                    <option value="course">Khóa học cụ thể</option>
                  </select>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ngày hết hạn</label>
                  <input 
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-400 focus:outline-none focus:border-amber-500/40 transition"
                    required
                  />
                </div>
              </div>

              {/* Course Selector (conditional) */}
              {scope === 'course' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chọn khóa học áp dụng</label>
                  <select 
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-400 focus:outline-none focus:border-amber-500/40 transition"
                    required
                  >
                    <option value="">-- Chọn khóa học từ danh sách --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.price?.toLocaleString('vi-VN')} đ)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Usage Limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng giới hạn sử dụng (0=vô hạn)</label>
                  <input 
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 transition"
                  />
                </div>

                {/* User Limit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Giới hạn / học viên</label>
                  <input 
                    type="number"
                    value={userLimit}
                    onChange={(e) => setUserLimit(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 transition"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-900">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 text-xs font-semibold rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isActionLoading}
                  className="py-2 px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
