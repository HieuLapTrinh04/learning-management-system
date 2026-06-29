import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeacherBalance, fetchTeacherWithdrawals, requestWithdrawal, clearWithdrawalError, clearWithdrawalSuccess } from './withdrawalSlice';
import { Wallet, ArrowUpRight, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function TeacherWithdrawals({ token }) {
  const dispatch = useDispatch();
  const { balance, withdrawals, isLoading, error, successMessage } = useSelector((state) => state.withdrawal);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ amount: '', bankName: '', bankAccount: '', accountName: '' });

  useEffect(() => {
    dispatch(fetchTeacherBalance(token));
    dispatch(fetchTeacherWithdrawals(token));
  }, [dispatch, token]);

  const handleRequest = (e) => {
    e.preventDefault();
    dispatch(requestWithdrawal({ token, ...formData })).then((res) => {
      if (!res.error) {
        setShowModal(false);
        setFormData({ amount: '', bankName: '', bankAccount: '', accountName: '' });
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1"><Clock size={12}/> Chờ duyệt</span>;
      case 'approved': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1"><CheckCircle size={12}/> Đã duyệt</span>;
      case 'paid': return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1"><CheckCircle size={12}/> Đã chuyển khoản</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1"><XCircle size={12}/> Từ chối</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-row justify-between items-center gap-2 md:gap-4 bg-slate-900/20 border border-slate-900 p-3 md:p-6 rounded-xl md:rounded-3xl">
        <div className="min-w-0">
          <h1 className="font-serif text-sm md:text-2xl font-bold text-slate-100 flex items-center gap-2 md:gap-3 truncate">
            <Wallet className="w-5 h-5 md:w-7 md:h-7 text-amber-500 flex-shrink-0" />
            <span className="truncate">Thu nhập & Rút tiền</span>
          </h1>
          <p className="text-[9px] md:text-xs text-slate-400 mt-1 md:mt-1.5 truncate">
            Quản lý doanh thu và yêu cầu rút tiền.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
          <button onClick={() => dispatch(clearWithdrawalError())} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-green-400 font-medium">{successMessage}</p>
          </div>
          <button onClick={() => dispatch(clearWithdrawalSuccess())} className="text-green-400 hover:text-green-300">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg">
          <p className="text-[10px] md:text-sm text-slate-400 font-medium truncate">Tổng doanh thu lũy kế</p>
          <p className="text-base md:text-2xl font-bold text-slate-100 mt-1 md:mt-2 truncate">{formatCurrency(balance.total_revenue)}</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg">
          <p className="text-[10px] md:text-sm text-slate-400 font-medium truncate">Đã rút (hoặc đang chờ)</p>
          <p className="text-base md:text-2xl font-bold text-slate-100 mt-1 md:mt-2 truncate">{formatCurrency(balance.total_withdrawn)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] md:text-sm text-amber-200 font-medium truncate">Số dư khả dụng</p>
            <p className="text-base md:text-3xl font-bold text-amber-500 mt-1 md:mt-2 truncate">{formatCurrency(balance.available)}</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            disabled={balance.available < 100000}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
          >
            Rút tiền <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="bg-slate-900/40 rounded-xl md:rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-800">
          <h3 className="text-sm md:text-lg font-semibold text-slate-100">Lịch sử rút tiền</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-xs md:text-sm text-left">
            <thead className="text-[9px] md:text-xs text-slate-400 uppercase bg-slate-950/40 whitespace-nowrap">
              <tr>
                <th className="px-3 py-2 md:px-6 md:py-4 font-medium">Mã YC / Ngày tạo</th>
                <th className="px-3 py-2 md:px-6 md:py-4 font-medium">Số tiền</th>
                <th className="px-3 py-2 md:px-6 md:py-4 font-medium">Tài khoản nhận</th>
                <th className="px-3 py-2 md:px-6 md:py-4 font-medium text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-3 py-6 md:px-6 md:py-8 text-center text-[10px] md:text-sm text-slate-500">
                    Bạn chưa có yêu cầu rút tiền nào.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <p className="font-medium text-slate-200">#{w.id}</p>
                      <p className="text-[9px] md:text-xs text-slate-500">{new Date(w.created_at).toLocaleString('vi-VN')}</p>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 font-medium text-amber-500">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <p className="text-slate-300 font-medium text-[10px] md:text-sm">{w.bank_name}</p>
                      <p className="text-[9px] md:text-xs text-slate-400">{w.account_name} - {w.bank_account}</p>
                      {w.admin_note && (
                        <p className="text-[9px] md:text-xs text-red-400 mt-1 flex gap-1 items-start">
                          <AlertCircle size={10} className="shrink-0 mt-0.5 md:w-3 md:h-3" /> 
                          Lý do: {w.admin_note}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-right">
                      {getStatusBadge(w.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[320px] md:max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-100">Tạo yêu cầu rút tiền</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Số tiền muốn rút (VNĐ)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    min="100000"
                    max={balance.available}
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none pr-12"
                    placeholder="Nhập số tiền..."
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">đ</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Tối thiểu: 100,000đ. Tối đa: {formatCurrency(balance.available)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ngân hàng</label>
                <input 
                  type="text" 
                  required 
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="Ví dụ: Vietcombank, Techcombank..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên chủ tài khoản</label>
                <input 
                  type="text" 
                  required 
                  value={formData.accountName}
                  onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none uppercase"
                  placeholder="NGUYEN VAN A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Số tài khoản</label>
                <input 
                  type="text" 
                  required 
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="Nhập số tài khoản..."
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-600 text-slate-900 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
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
