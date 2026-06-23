import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminTransactions, refundOrder, exportTransactionsCSV } from './paymentSlice';
import { CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, Loader2, DollarSign, Search, Filter, RotateCcw, ChevronLeft, ChevronRight, User, Download } from 'lucide-react';

export default function AdminTransactions({ token }) {
  const dispatch = useDispatch();
  const { transactions, totalTransactions, isLoading, error } = useSelector((state) => state.payment);
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminTransactions({ token, page, limit, status, search }));
    }
  }, [dispatch, token, page, status, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchAdminTransactions({ token, page, limit, status, search }));
  };

  const handleRefund = async (orderId, txnRef) => {
    if (window.confirm(`Bạn có chắc chắn muốn hoàn tiền cho giao dịch ${txnRef}? Việc này sẽ thu hồi quyền truy cập khóa học của học viên ngay lập tức.`)) {
      try {
        const result = await dispatch(refundOrder({ token, orderId })).unwrap();
        alert(result.message || 'Hoàn tiền thành công');
        handleRefresh();
      } catch (err) {
        alert(err || 'Hoàn tiền thất bại');
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      await dispatch(exportTransactionsCSV({ token, status, search })).unwrap();
    } catch (err) {
      alert(err || 'Lỗi xuất file CSV');
    }
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
            <span>Báo Cáo & Quản Lý Giao Dịch</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu lịch sử mua khóa học của sinh viên, xem hóa đơn và thực thi hoàn tiền.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-900/20"
            title="Xuất báo cáo CSV"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative col-span-1">
          <input
            type="text"
            placeholder="Tìm theo mã giao dịch (txn_ref)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-850 focus:border-amber-500/50 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
        </form>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto col-span-2 pb-1">
          <span className="text-xs text-slate-500 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Trạng thái:</span>
          </span>
          {[
            { value: '', label: 'Tất cả' },
            { value: 'paid', label: 'Đã thanh toán' },
            { value: 'pending', label: 'Chờ xử lý' },
            { value: 'refunded', label: 'Đã hoàn tiền' },
            { value: 'failed', label: 'Thất bại' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleStatusChange(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${status === item.value ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-900/35 border-slate-850 text-slate-400 hover:text-slate-200'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

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
          <p className="text-xs text-slate-500 mt-1">Vui lòng điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-slate-900/60 rounded-2xl overflow-hidden bg-slate-950/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-450 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4">Mã GD / Ngày</th>
                  <th className="p-4">Học viên</th>
                  <th className="p-4">Nội dung mua hàng</th>
                  <th className="p-4 text-right">Tổng tiền</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((order) => {
                  const dateStr = new Date(order.created_at).toLocaleDateString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });

                  return (
                    <tr key={order.id} className="border-b border-slate-900/50 hover:bg-slate-900/10 transition">
                      
                      {/* Code and Date */}
                      <td className="p-4 space-y-1">
                        <span className="font-mono font-bold text-slate-200 block">{order.txn_ref}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-350">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-semibold text-slate-200">ID: {order.student_id}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Sinh viên nền tảng</span>
                      </td>

                      {/* Purchased Courses list */}
                      <td className="p-4 max-w-xs">
                        <div className="space-y-1">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="truncate text-slate-300 font-semibold" title={item.course?.title}>
                              • {item.course?.title || `Khóa học #${item.course_id}`}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="p-4 text-right font-mono font-bold text-slate-200">
                        {order.total_amount?.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Refund Actions */}
                      <td className="p-4 text-center">
                        {order.status === 'paid' ? (
                          <button
                            onClick={() => handleRefund(order.id, order.txn_ref)}
                            className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/20 border border-red-900/40 text-red-400 font-semibold rounded-lg text-[10px] transition duration-200"
                          >
                            Hoàn tiền
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-bold">-</span>
                        )}
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
