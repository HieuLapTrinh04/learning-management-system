import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X, Star, Eye, EyeOff } from 'lucide-react';

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    role: '',
    avatar_url: '',
    content: '',
    rating: 5,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('lms_token');
      const response = await axios.get('/api/v1/admin/testimonials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestimonials(response.data?.data || []);
    } catch (error) {
      alert('Lỗi khi tải danh sách đánh giá');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (testimonial = null) => {
    if (testimonial) {
      setFormData(testimonial);
    } else {
      setFormData({
        id: null,
        name: '',
        role: '',
        avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`, // Default random avatar
        content: '',
        rating: 5,
        is_active: true,
        sort_order: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('lms_token');
    
    try {
      if (formData.id) {
        // Update
        await axios.put(`/api/v1/admin/testimonials/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Đã cập nhật đánh giá');
      } else {
        // Create
        await axios.post('/api/v1/admin/testimonials', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Đã thêm đánh giá mới');
      }
      closeModal();
      fetchTestimonials();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    
    const token = localStorage.getItem('lms_token');
    try {
      await axios.delete(`/api/v1/admin/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa đánh giá');
      fetchTestimonials();
    } catch (error) {
      alert('Lỗi khi xóa đánh giá');
    }
  };

  const handleToggleActive = async (testimonial) => {
    const token = localStorage.getItem('lms_token');
    try {
      await axios.put(`/api/v1/admin/testimonials/${testimonial.id}`, {
        ...testimonial,
        is_active: !testimonial.is_active
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(testimonial.is_active ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá');
      fetchTestimonials();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2 sm:gap-3">
            <Star className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 fill-amber-500" />
            <span>Quản lý Đánh giá</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-normal">Quản lý các đánh giá hiển thị trên trang chủ Landing Page.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="py-1.5 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 text-[10px] sm:text-xs font-bold rounded-xl flex items-center gap-1.5 sm:gap-2 transition duration-200"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 h-4 text-slate-950" />
          <span>Thêm Đánh giá</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-[10px] sm:text-xs uppercase font-mono tracking-wider">
                  <th className="px-4 py-3 sm:p-4 font-semibold w-[200px] sm:w-[250px]">Người đánh giá</th>
                  <th className="px-4 py-3 sm:p-4 font-semibold w-full">Nội dung</th>
                  <th className="px-4 py-3 sm:p-4 font-semibold text-center w-[100px] sm:w-[120px]">Đánh giá</th>
                  <th className="px-4 py-3 sm:p-4 font-semibold text-center w-[120px] sm:w-[150px]">Trạng thái</th>
                  <th className="px-4 py-3 sm:p-4 font-semibold text-right w-[100px] sm:w-[120px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {testimonials.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      Chưa có đánh giá nào. Hãy thêm đánh giá mới!
                    </td>
                  </tr>
                ) : testimonials.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <img src={item.avatar_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 text-xs sm:text-sm truncate">{item.name}</div>
                          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{item.role}</div>
                        </div>
                      </div>
                    </td>
                    <td 
                      className="px-4 py-3 sm:p-4 cursor-pointer overflow-hidden"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <p className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${expandedId === item.id ? 'whitespace-normal' : 'whitespace-nowrap overflow-hidden text-ellipsis'}`} title="Nhấn để xem thêm">
                        "{item.content}"
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
                        {item.rating} <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:p-4 text-center">
                      <button 
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase ${
                          item.is_active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-900/30' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-900/30'
                        } transition-colors whitespace-nowrap`}
                      >
                        {item.is_active ? 'Hiển thị' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="px-4 py-3 sm:p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white">
                {formData.id ? 'Sửa Đánh giá' : 'Thêm Đánh giá mới'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="testimonial-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Tên người đánh giá *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      placeholder="VD: Mai Anh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Chức danh / Nơi làm việc</label>
                    <input 
                      type="text" 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      placeholder="VD: Kỹ sư tại Google"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">URL Ảnh đại diện (Avatar)</label>
                  <div className="flex gap-3 items-center">
                    <img src={formData.avatar_url || 'https://via.placeholder.com/150'} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800 flex-shrink-0" />
                    <input 
                      type="url" 
                      value={formData.avatar_url}
                      onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Nội dung đánh giá *</label>
                  <textarea 
                    required
                    rows="4"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                    placeholder="Khóa học rất tuyệt vời..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Số sao (1-5)</label>
                    <input 
                      type="number" 
                      min="1" max="5"
                      required
                      value={formData.rating}
                      onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Thứ tự hiển thị</label>
                    <input 
                      type="number" 
                      value={formData.sort_order}
                      onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Trạng thái</label>
                    <div className="flex items-center h-[42px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={formData.is_active}
                          onChange={e => setFormData({...formData, is_active: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-3 text-sm font-medium text-slate-300">
                          {formData.is_active ? 'Hiển thị' : 'Ẩn'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 mt-auto">
              <button 
                type="button" 
                onClick={closeModal}
                className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                form="testimonial-form"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                Lưu Đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
