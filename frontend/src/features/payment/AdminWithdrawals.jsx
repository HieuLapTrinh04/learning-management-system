import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminWithdrawals, updateWithdrawalStatus, clearWithdrawalError, clearWithdrawalSuccess } from './withdrawalSlice';
import { Wallet, CheckCircle, XCircle, Clock, Search, Filter, AlertCircle, MessageSquare } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function AdminWithdrawals({ token }) {
  const dispatch = useDispatch();
  const { withdrawals, isLoading, error, successMessage } = useSelector((state) => state.withdrawal);
  const [filterStatus, setFilterStatus] = useState('');
  
  const [actionModal, setActionModal] = useState(null); // { id: 1, action: 'approved' | 'paid' | 'rejected' }
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    dispatch(fetchAdminWithdrawals({ token, status: filterStatus }));
  }, [dispatch, token, filterStatus]);

  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (!actionModal) return;
    dispatch(updateWithdrawalStatus({ 
      token, 
      id: actionModal.id, 
      status: actionModal.action, 
      adminNote 
    })).then((res) => {
      if (!res.error) {
        setActionModal(null);
        setAdminNote('');
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1 w-fit"><Clock size={12}/> Chờ duyệt</span>;
      case 'approved': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1 w-fit"><CheckCircle size={12}/> Đã duyệt</span>;
      case 'paid': return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1 w-fit"><CheckCircle size={12}/> Đã thanh toán</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1 w-fit"><XCircle size={12}/> Từ chối</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-3xl">
        <div>
          <h2 className="text-lg sm:text-2xl font-semibold text-slate-100 flex items-center gap-1.5 sm:gap-2">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            Yêu cầu Rút tiền
          </h2>
          <p className="text-[10px] sm:text-sm text-slate-400 mt-1">Duyệt và quản lý yêu cầu thanh toán doanh thu từ giảng viên.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto pl-8 sm:pl-10 pr-6 sm:pr-8 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 appearance-none text-[10px] sm:text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt (Chờ CK)</option>
              <option value="paid">Đã thanh toán</option>
              <option value="rejected">Bị từ chối</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <p className="text-red-400 font-medium flex-1">{error}</p>
          <button onClick={() => dispatch(clearWithdrawalError())} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-green-400 shrink-0" size={20} />
          <p className="text-green-400 font-medium flex-1">{successMessage}</p>
          <button onClick={() => dispatch(clearWithdrawalSuccess())} className="text-green-400 hover:text-green-300">✕</button>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="text-[9px] sm:text-xs text-slate-400 uppercase bg-slate-900/50 tracking-wider">
              <tr>
                <th className="px-2 py-1.5 sm:px-6 sm:py-4 font-medium">Giảng viên</th>
                <th className="px-2 py-1.5 sm:px-6 sm:py-4 font-medium">Số tiền</th>
                <th className="px-2 py-1.5 sm:px-6 sm:py-4 font-medium">Thông tin ngân hàng</th>
                <th className="px-2 py-1.5 sm:px-6 sm:py-4 font-medium">Trạng thái</th>
                <th className="px-2 py-1.5 sm:px-6 sm:py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy yêu cầu rút tiền nào.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-2 py-1.5 sm:px-6 sm:py-4">
                      <p className="font-medium text-xs sm:text-sm text-slate-200">{w.teacher?.name}</p>
                      <p className="text-[9px] sm:text-xs text-slate-500">{w.teacher?.email}</p>
                      <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Ngày YC: {new Date(w.created_at).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-2 py-1.5 sm:px-6 sm:py-4 font-medium text-amber-500 text-[10px] sm:text-lg">
                      {formatCurrency(w.amount)}
                    </td>
                    <td className="px-2 py-1.5 sm:px-6 sm:py-4">
                      <p className="text-[10px] sm:text-sm text-slate-300 font-medium">{w.bank_name}</p>
                      <p className="text-[9px] sm:text-sm text-slate-100">{w.account_name}</p>
                      <p className="font-mono text-[8px] sm:text-xs text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded w-fit mt-0.5 sm:mt-1">{w.bank_account}</p>
                    </td>
                    <td className="px-2 py-1.5 sm:px-6 sm:py-4">
                      <div className="scale-75 origin-left sm:scale-100">
                        {getStatusBadge(w.status)}
                      </div>
                      {w.admin_note && (
                        <p className="text-[9px] sm:text-xs text-slate-400 mt-1 sm:mt-2 italic max-w-[120px] sm:max-w-[200px]">Note: {w.admin_note}</p>
                      )}
                    </td>
                    <td className="px-2 py-1.5 sm:px-6 sm:py-4 text-right">
                      {w.status === 'pending' && (
                        <div className="flex justify-end gap-1.5 sm:gap-2">
                          <button 
                            onClick={() => setActionModal({ id: w.id, action: 'approved' })}
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500 hover:bg-blue-600 text-white text-[9px] sm:text-xs rounded font-medium transition-colors"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => setActionModal({ id: w.id, action: 'rejected' })}
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] sm:text-xs rounded font-medium transition-colors"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                      {w.status === 'approved' && (
                        <button 
                          onClick={() => setActionModal({ id: w.id, action: 'paid' })}
                          className="px-2 py-1 sm:px-3 sm:py-1 bg-green-500 hover:bg-green-600 text-white text-[9px] sm:text-xs rounded font-medium transition-colors whitespace-nowrap"
                        >
                          Xác nhận CK
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-100">
                {actionModal.action === 'approved' ? 'Duyệt yêu cầu rút tiền' :
                 actionModal.action === 'paid' ? 'Xác nhận chuyển khoản' : 'Từ chối yêu cầu'}
              </h3>
            </div>
            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              {actionModal.action === 'approved' && (
                <p className="text-slate-300 text-sm">
                  Bạn sắp duyệt yêu cầu này. Kế toán có thể lấy thông tin và tiến hành chuyển khoản. Bạn có chắc chắn?
                </p>
              )}
              {actionModal.action === 'paid' && (
                <p className="text-slate-300 text-sm">
                  Đánh dấu yêu cầu này là <b>Đã thanh toán</b>. Chỉ thực hiện khi bạn đã hoàn tất chuyển khoản cho giảng viên.
                </p>
              )}
              
              {(actionModal.action === 'rejected' || actionModal.action === 'paid') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ghi chú (Bắt buộc nếu từ chối, tùy chọn nếu đã thanh toán)
                  </label>
                  <textarea 
                    required={actionModal.action === 'rejected'}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder="Nhập lý do..."
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-700 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                    actionModal.action === 'rejected' ? 'bg-red-500 hover:bg-red-600' :
                    actionModal.action === 'paid' ? 'bg-green-500 hover:bg-green-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
