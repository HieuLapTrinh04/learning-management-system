import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentHistory } from './paymentSlice';
import { CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, BookOpen, Loader2, DollarSign, ExternalLink, Download } from 'lucide-react';
import axios from 'axios';

export default function PaymentHistory({ token }) {
  const dispatch = useDispatch();
  const { history, isLoading, error } = useSelector((state) => state.payment);

  useEffect(() => {
    if (token) {
      dispatch(fetchPaymentHistory(token));
    }
  }, [dispatch, token]);

  const handleRetryPayment = async (courseIds) => {
    try {
      const response = await axios.post('/api/v1/student/payments/checkout', {
        course_ids: courseIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success && response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        alert(response.data.message || 'Không thể tạo lại liên kết thanh toán');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi kết nối khi thanh toán lại');
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await axios.get(`/api/v1/student/payments/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `invoice_LMS_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể tải hóa đơn. Vui lòng thử lại sau.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-950/40 border border-red-900/40 px-2.5 py-1 rounded-full">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>Thất bại</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2.5 py-1 rounded-full animate-pulse">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Chờ xử lý</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang tải lịch sử giao dịch...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 max-w-2xl mx-auto my-10">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold">Lỗi tải dữ liệu</p>
          <p>{error}</p>
          <button 
            onClick={() => dispatch(fetchPaymentHistory(token))} 
            className="flex items-center gap-1 text-amber-500 font-bold hover:underline mt-2"
          >
            <RefreshCw className="w-3 h-3" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 sm:gap-x-4 sm:gap-y-1 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl items-center">
        <h2 className="font-serif text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2 sm:gap-2.5 col-start-1 row-start-1">
          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0" />
          <span className="truncate">Lịch Sử Thanh Toán</span>
        </h2>
        <p className="text-[9px] sm:text-xs text-slate-400 col-start-1 row-start-2">
          Quản lý hóa đơn đăng ký và theo dõi trạng thái giao dịch mua khóa học.
        </p>
        <div className="flex col-start-2 row-start-1 row-span-2 items-center justify-end">
          <button
            onClick={() => dispatch(fetchPaymentHistory(token))}
            className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-200 transition"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 sm:py-20 border border-dashed border-slate-900 rounded-2xl sm:rounded-3xl bg-slate-950/10 mx-4 sm:mx-0">
          <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-slate-700 mx-auto mb-3 sm:mb-4" />
          <p className="text-xs sm:text-sm font-semibold text-slate-400">Không tìm thấy giao dịch nào</p>
          <p className="text-[10px] sm:text-xs text-slate-650 mt-1">Bạn chưa thực hiện bất kỳ giao dịch mua khóa học nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            const courseIds = order.order_items?.map(item => item.course_id) || [];

            return (
              <div 
                key={order.id}
                className="bg-slate-900/30 border border-slate-900 hover:border-slate-850 transition-colors rounded-xl md:rounded-2xl p-3 md:p-5"
              >
                {/* Header block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 md:gap-3 pb-2.5 md:pb-4 border-b border-slate-900">
                  <div className="space-y-0.5 md:space-y-1">
                    <span className="text-[9px] md:text-[10px] text-slate-500 font-mono block">MÃ GD: {order.txn_ref}</span>
                    <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-slate-300">
                      <Calendar className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 scale-75 sm:scale-100 origin-left sm:origin-center">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Items list */}
                <div className="py-2 md:py-3 divide-y divide-slate-900">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="py-1.5 md:py-2 flex items-center justify-between text-[10px] md:text-xs gap-2 md:gap-4">
                      <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                          {item.course?.title ? item.course.title[0] : 'C'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{item.course?.title || `Khóa học #${item.course_id}`}</p>
                          <p className="text-[8px] md:text-[10px] text-slate-500 mt-0.5">Giảng viên: {item.course?.teacher?.name || 'Đội ngũ LMS'}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400 flex-shrink-0">
                        {item.price?.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer block */}
                <div className="pt-2.5 md:pt-4 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-[9px] md:text-xs text-slate-500">Tổng thanh toán:</span>
                    <span className="font-mono font-bold text-amber-500 text-[11px] md:text-sm">
                      {order.total_amount?.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-2 self-end sm:self-auto">
                    {order.status === 'paid' && (
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="px-2 py-1 md:px-4 md:py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 font-bold rounded-md md:rounded-xl text-[9px] md:text-xs flex items-center gap-1 md:gap-1.5 transition duration-200"
                      >
                        <Download className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                        <span>Tải hóa đơn</span>
                      </button>
                    )}

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleRetryPayment(courseIds)}
                        className="px-2 py-1 md:px-4 md:py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md md:rounded-xl text-[9px] md:text-xs flex items-center gap-1 md:gap-1.5 transition duration-200"
                      >
                        <CreditCard className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                        <span>Thanh toán lại</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
