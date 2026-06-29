import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Shield, ShieldAlert, UserCheck, UserX, Loader2, Search, Edit2, User, Key, UserPlus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function AdminManageUsers() {
  const { token, userId: currentUserId } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get(`/api/v1/admin/users?role=${roleFilter}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, roleFilter, statusFilter]);

  const toggleStatus = async (userId, currentStatus) => {
    if (userId === currentUserId) {
      alert("Không thể khóa tài khoản của chính mình!");
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} người dùng này?`)) return;

    try {
      const res = await axiosClient.put(`/api/v1/admin/users/${userId}/status`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const changeRole = async (userId, newRole) => {
    if (userId === currentUserId) {
      alert("Không thể tự thay đổi quyền của chính mình!");
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn cấp quyền ${newRole.toUpperCase()} cho người dùng này?`)) return;

    try {
      const res = await axiosClient.put(`/api/v1/admin/users/${userId}/role`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi cập nhật quyền');
    }
  };

  const deleteUser = async (userId) => {
    if (userId === currentUserId) {
      alert("Không thể xóa tài khoản của chính mình!");
      return;
    }
    if (!window.confirm("Cảnh báo: Hành động này sẽ xóa hoàn toàn người dùng khỏi hệ thống. Bạn có chắc chắn muốn xóa?")) return;

    try {
      const res = await axiosClient.delete(`/api/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa người dùng');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            Quản lý người dùng
          </h2>
          <p className="text-sm text-slate-400 mt-1">Quản lý tài khoản, trạng thái và phân quyền hệ thống.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <label className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 block">Vai trò</label>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="student">Học viên</option>
            <option value="teacher">Giảng viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2 block">Trạng thái</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 text-xs sm:text-sm">{user.name}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : user.role === 'teacher' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Key className="w-3.5 h-3.5" />
                          Giảng viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <User className="w-3.5 h-3.5" />
                          Học viên
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-xs sm:text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-right">
                      {user.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          <select 
                            value={user.role}
                            onChange={(e) => changeRole(user.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs text-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="student">Học viên</option>
                            <option value="teacher">Giảng viên</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                          
                          <button
                            onClick={() => toggleStatus(user.id, user.is_active)}
                            className="p-1 sm:p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-slate-700 transition-colors"
                            title={user.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.is_active ? <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                          </button>

                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-1 sm:p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
