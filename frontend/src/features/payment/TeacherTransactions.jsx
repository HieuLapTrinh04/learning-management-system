import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeacherTransactions } from './paymentSlice';
import { CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2, DollarSign, Search, Filter, RotateCcw, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function TeacherTransactions({ token }) {
  const dispatch = useDispatch();
  const { transactions, totalTransactions, isLoading, error } = useSelector((state) => state.payment);
  
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (token) {
      dispatch(fetchTeacherTransactions({ token, page, limit }));
    }
  }, [dispatch, token, page]);

  const handleRefresh = () => {
    dispatch(fetchTeacherTransactions({ token, page, limit }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-950/40 border border-red-900/40 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>Thất bại</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Đã hoàn tiền</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Chờ xử lý</span>
          </span>
        );
    }
  };

  const totalPages = Math.ceil(totalTransactions / limit) || 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-amber-500" />
            <span>Lịch Sử Nhận Hoa Hồng</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu lịch sử học viên mua khóa học và doanh thu thực nhận của bạn.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
          title="Tải lại danh sách"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Ledger Table */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="text-xs text-slate-500">Đang tải danh sách giao dịch...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-400 max-w-md mx-auto text-center">
          <p className="font-semibold mb-1">Không thể tải danh sách giao dịch</p>
          <p>{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-900 rounded-3xl bg-slate-950/10">
          <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-400">Không tìm thấy giao dịch nào</p>
          <p className="text-xs text-slate-500 mt-1">Chưa có học viên mua khóa học của bạn.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-slate-900/60 rounded-2xl overflow-hidden bg-slate-950/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-450 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4">Mã GD / Ngày</th>
                  <th className="p-4">Khóa học</th>
                  <th className="p-4 text-right">Học phí gốc</th>
                  <th className="p-4 text-right">Phí thực trả</th>
                  <th className="p-4 text-right text-amber-500">Hoa hồng (70%)</th>
                  <th className="p-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => {
                  const dateStr = new Date(item.order?.created_at || new Date()).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });

                  return (
                    <tr key={item.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition">
                      
                      {/* Code and Date */}
                      <td className="p-4 space-y-1">
                        <span className="font-mono font-bold text-slate-200 block">{item.order?.txn_ref || 'N/A'}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Purchased Course */}
                      <td className="p-4 max-w-xs">
                        <div className="truncate text-slate-300 font-semibold" title={item.course?.title}>
                          {item.course?.title || `Khóa học #${item.course_id}`}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Sinh viên ID: {item.order?.student_id || 'N/A'}</span>
                      </td>

                      {/* Original Price */}
                      <td className="p-4 text-right font-mono font-medium text-slate-400">
                        {item.price?.toLocaleString('vi-VN')} đ
                      </td>
                      
                      {/* Final Price (After discounts) */}
                      <td className="p-4 text-right font-mono font-medium text-emerald-500">
                        {item.final_price?.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Teacher Revenue */}
                      <td className="p-4 text-right font-mono font-bold text-amber-500">
                        {item.teacher_revenue?.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {getStatusBadge(item.order?.status || 'paid')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-slate-900/10 border border-slate-900 rounded-xl p-4">
              <span className="text-[11px] text-slate-500">
                Hiển thị trang {page} / {totalPages} (Tổng {totalTransactions} giao dịch)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 disabled:opacity-40 disabled:hover:bg-slate-950 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 disabled:opacity-40 disabled:hover:bg-slate-950 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
