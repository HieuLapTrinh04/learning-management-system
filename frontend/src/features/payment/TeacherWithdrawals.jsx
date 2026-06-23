import React, { useEffect, useState } from 'react';
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
      <div>
        <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
          <Wallet className="text-amber-500" />
          Thu nhập & Rút tiền
        </h2>
        <p className="text-slate-400 mt-1">Quản lý doanh thu từ các khóa học và yêu cầu rút tiền về tài khoản ngân hàng của bạn.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 shadow-lg">
          <p className="text-sm text-slate-400 font-medium">Tổng doanh thu lũy kế</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{formatCurrency(balance.total_revenue)}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 shadow-lg">
          <p className="text-sm text-slate-400 font-medium">Đã rút (hoặc đang chờ)</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{formatCurrency(balance.total_withdrawn)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <p className="text-sm text-amber-200 font-medium">Số dư khả dụng</p>
          <p className="text-3xl font-bold text-amber-500 mt-2">{formatCurrency(balance.available)}</p>
          <button 
            onClick={() => setShowModal(true)}
            disabled={balance.available < 100000}
            className="absolute top-1/2 -translate-y-1/2 right-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Rút tiền <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100">Lịch sử rút tiền</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 font-medium">Mã YC / Ngày tạo</th>
                <th className="px-6 py-4 font-medium">Số tiền</th>
                <th className="px-6 py-4 font-medium">Tài khoản nhận</th>
                <th className="px-6 py-4 font-medium text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    Bạn chưa có yêu cầu rút tiền nào.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">#{w.id}</p>
                      <p className="text-xs text-slate-500">{new Date(w.created_at).toLocaleString('vi-VN')}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-amber-500">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300 font-medium">{w.bank_name}</p>
                      <p className="text-xs text-slate-400">{w.account_name} - {w.bank_account}</p>
                      {w.admin_note && (
                        <p className="text-xs text-red-400 mt-1 flex gap-1 items-start">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" /> 
                          Lý do: {w.admin_note}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
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
        </div>
      )}
    </div>
  );
}
