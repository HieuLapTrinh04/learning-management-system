import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle, Search, Clock, ShieldAlert } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function AdminApproveCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending', 'draft', 'published', 'all'
  
  const token = useSelector(state => state.auth.token);

  const fetchCourses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const statusQuery = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`/api/v1/admin/courses${statusQuery}`, { headers });
      setCourses(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi tải danh sách khóa học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token, filter]);

  const handleUpdateStatus = async (courseId, newStatus) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`/api/v1/admin/courses/${courseId}/status`, { status: newStatus }, { headers });
      
      setSuccess(`Cập nhật trạng thái khóa học thành '${newStatus}' thành công!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Remove from list if we are filtering by a specific status
      if (filter !== 'all') {
        setCourses(courses.filter(c => c.id !== courseId));
      } else {
        // Otherwise just update the status in the local state
        setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái khóa học.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            <span>Phê duyệt khóa học</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Kiểm duyệt và xuất bản các khóa học do giáo viên tạo.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{success}</span>
        </div>
      )}

      <div className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-270px)]">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-900 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center bg-slate-950/30">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto max-w-full hide-scrollbar">
            {['pending', 'draft', 'published', 'all'].map((f) => {
              const labels = {
                pending: 'Chờ duyệt',
                draft: 'Bản nháp',
                published: 'Đã xuất bản',
                all: 'Tất cả'
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                    filter === f 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-20 flex justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <div className="inline-flex w-16 h-16 rounded-full bg-slate-900 items-center justify-center mb-4">
                <Search className="w-6 h-6 text-slate-700" />
              </div>
              <p>Không tìm thấy khóa học nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {courses.map(course => (
                <div key={course.id} className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-3 sm:p-5 flex flex-col justify-between group">
                  <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <img 
                      src={course.thumbnail_url || 'https://via.placeholder.com/150'} 
                      alt={course.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-100 text-xs sm:text-sm truncate">{course.title}</h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">{course.subtitle || 'Không có phụ đề'}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                        <span className="text-[10px] font-mono text-amber-500">{course.price?.toLocaleString('vi-VN')} đ</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 block line-clamp-1">Giảng viên: {course.teacher?.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 sm:pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {course.status === 'pending' && <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-amber-500/10 text-amber-500 rounded-md border border-amber-500/20"><Clock className="w-3 h-3"/> Chờ duyệt</span>}
                      {course.status === 'published' && <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20"><CheckCircle2 className="w-3 h-3"/> Đã xuất bản</span>}
                      {course.status === 'draft' && <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-slate-800 text-slate-400 rounded-md border border-slate-700"><CheckCircle2 className="w-3 h-3 opacity-50"/> Bản nháp</span>}
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {course.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(course.id, 'draft')}
                            className="flex-1 sm:flex-none px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition"
                          >
                            Từ chối
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(course.id, 'published')}
                            className="flex-1 sm:flex-none px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                          >
                            Phê duyệt
                          </button>
                        </>
                      )}
                      
                      {course.status === 'published' && (
                        <button 
                          onClick={() => handleUpdateStatus(course.id, 'draft')}
                          className="flex-1 sm:flex-none px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 transition"
                        >
                          Hủy xuất bản
                        </button>
                      )}
                      
                      {course.status === 'draft' && (
                        <button 
                          onClick={() => handleUpdateStatus(course.id, 'published')}
                          className="flex-1 sm:flex-none px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                        >
                          Phê duyệt ngay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
