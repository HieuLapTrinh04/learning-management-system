import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  ShieldAlert, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  Clock
} from 'lucide-react';
import api from '../../api/axiosClient';

export default function AuditLogViewer() {
  const { token } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters and Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [search, setSearch] = useState('');
  
  // To delay search trigger
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [page, action, entity, search]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, action, entity, search }
      });
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getActionColor = (act) => {
    if (act === 'LOGIN') return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (act.includes('CREATE') || act.includes('SUCCESS')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (act.includes('FAILED') || act.includes('DELETE')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (act.includes('UPDATE') || act.includes('GRADED')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-100 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-brand-500" />
            <span>Nhật ký Hệ thống</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Giám sát các hoạt động quan trọng trong nền tảng.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo chi tiết hoặc tên người dùng..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={action} 
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 focus:border-brand-500 outline-none"
          >
            <option value="">Tất cả Hành động</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="REGISTER">Đăng ký</option>
            <option value="COURSE_CREATE">Tạo khóa học</option>
            <option value="COURSE_UPDATE">Sửa khóa học</option>
            <option value="PAYMENT_SUCCESS">Thanh toán (TC)</option>
            <option value="PAYMENT_FAILED">Thanh toán (TB)</option>
            <option value="ASSIGNMENT_GRADED">Chấm điểm</option>
          </select>
          <select 
            value={entity} 
            onChange={(e) => { setEntity(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 focus:border-brand-500 outline-none"
          >
            <option value="">Tất cả Thực thể</option>
            <option value="User">Người dùng</option>
            <option value="Course">Khóa học</option>
            <option value="Order">Đơn hàng</option>
            <option value="Submission">Bài nộp</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold">Người dùng</th>
                <th className="px-6 py-4 font-semibold">Hành động</th>
                <th className="px-6 py-4 font-semibold">Thực thể (ID)</th>
                <th className="px-6 py-4 font-semibold">Chi tiết</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy nhật ký nào phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-slate-200">{log.user.name}</span>
                          <span className="text-[10px] text-slate-500">#{log.user.id}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Hệ thống</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {log.entity} <span className="text-slate-500">#{log.entity_id}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/30">
            <span className="text-xs text-slate-500">
              Hiển thị <span className="text-slate-300 font-medium">{logs.length}</span> / <span className="text-slate-300 font-medium">{total}</span> kết quả
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-300 px-2">
                Trang {page} / {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
