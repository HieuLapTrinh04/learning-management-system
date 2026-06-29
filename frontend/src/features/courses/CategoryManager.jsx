import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  Loader2, 
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const token = localStorage.getItem('lms_token');

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await axios.get('/api/v1/categories');
      const catData = response.data?.data || response.data || [];
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      setApiError('Không thể tải danh mục. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode('edit');
    setSelectedCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Tên danh mục không được để trống');
      return;
    }
    setFormError('');
    setIsSaving(true);

    try {
      let response;
      const headers = { Authorization: `Bearer ${token}` };

      if (modalMode === 'create') {
        response = await axios.post('/api/v1/admin/categories', { name, description }, { headers });
      } else {
        response = await axios.put(`/api/v1/admin/categories/${selectedCategory.id}`, { name, description }, { headers });
      }

      if (response.status === 201 || response.status === 200 || response.data.success) {
        setSuccessMsg(modalMode === 'create' ? 'Đã tạo danh mục mới thành công!' : 'Đã cập nhật danh mục thành công!');
        setIsModalOpen(false);
        fetchCategories();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Đã xảy ra lỗi khi lưu danh mục.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này không? Các khóa học thuộc danh mục này có thể bị ảnh hưởng.')) {
      return;
    }
    setApiError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/v1/admin/categories/${id}`, { headers });
      setSuccessMsg('Xóa danh mục thành công!');
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Không thể xóa danh mục này.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Board */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2 sm:gap-2.5">
            <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            <span>Quản Lý Danh Mục Khóa Học</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Phân loại các lĩnh vực bài giảng để học viên dễ dàng tìm kiếm.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="py-2 px-3 sm:py-2.5 sm:px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-[10px] sm:text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Tạo danh mục mới</span>
        </button>
      </div>

      {/* Alerts */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category List Table */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs text-slate-500">Đang tải danh sách chuyên mục...</span>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] sm:text-xs border-collapse whitespace-nowrap md:whitespace-normal">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 uppercase tracking-wider bg-slate-950/50">
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-semibold w-16">ID</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-semibold">Tên Danh Mục</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-semibold">Slug (Đường dẫn tĩnh)</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-semibold">Mô tả</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-semibold text-center w-32">Thao tác</th>
                </tr>
              </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Chưa có danh mục nào được khởi tạo.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-slate-900 hover:bg-slate-900/20 transition">
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-mono text-slate-500">#{cat.id}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-semibold text-slate-200">{cat.name}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 font-mono text-amber-500/80">{cat.slug}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-slate-400 max-w-[150px] md:max-w-xs truncate" title={cat.description}>{cat.description || "Không có mô tả"}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:p-4 text-center">
                      <div className="flex justify-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1 sm:p-1.5 rounded-lg bg-slate-950 border border-slate-900 hover:border-amber-500/40 text-slate-400 hover:text-amber-500 transition"
                          title="Sửa danh mục"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1 sm:p-1.5 rounded-lg bg-slate-950 border border-slate-900 hover:border-red-950 hover:text-red-400 transition"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-md w-full border border-slate-800 rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-slate-100 mb-6">
              {modalMode === 'create' ? 'Tạo Danh Mục Mới' : 'Cập Nhật Danh Mục'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tên danh mục</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lập trình Golang..."
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 placeholder-slate-650 focus:outline-none text-xs transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Mô tả chi tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Các khóa học lập trình và phát triển phần mềm..."
                  rows={4}
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 placeholder-slate-650 focus:outline-none text-xs transition"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
