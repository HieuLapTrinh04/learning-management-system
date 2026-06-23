import React, { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import api from "../../api/axiosClient";

const AdminLearningPaths = () => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
  });

  const [courseFormData, setCourseFormData] = useState({
    course_id: "",
    sequence_order: 0,
  });

  useEffect(() => {
    fetchPaths();
    fetchCourses();
  }, []);

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v1/learning-paths");
      setPaths(res.data.data || []);
    } catch (err) {
      setError("Lỗi khi tải lộ trình học tập");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      // Need a way to fetch all published courses for dropdown.
      // Admin might need to see all courses.
      const res = await api.get("/api/v1/courses");
      setCourses(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (path = null) => {
    if (path) {
      setSelectedPath(path);
      setFormData({
        title: path.title,
        description: path.description,
        thumbnail_url: path.thumbnail_url || "",
      });
    } else {
      setSelectedPath(null);
      setFormData({
        title: "",
        description: "",
        thumbnail_url: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPath) {
        await api.put(`/api/v1/admin/learning-paths/${selectedPath.id}`, formData);
        setSuccess("Cập nhật lộ trình thành công");
      } else {
        await api.post("/api/v1/admin/learning-paths", formData);
        setSuccess("Tạo mới lộ trình thành công");
      }
      setTimeout(() => setSuccess(""), 3000);
      setIsModalOpen(false);
      fetchPaths();
    } catch (err) {
      setError("Lỗi khi lưu lộ trình");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lộ trình này?")) return;
    try {
      await api.delete(`/api/v1/admin/learning-paths/${id}`);
      setSuccess("Xóa lộ trình thành công");
      setTimeout(() => setSuccess(""), 3000);
      fetchPaths();
    } catch (err) {
      setError("Lỗi khi xóa lộ trình");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleOpenCourseModal = (path) => {
    setSelectedPath(path);
    setCourseFormData({
      course_id: courses.length > 0 ? courses[0].id : "",
      sequence_order: (path.courses?.length || 0) + 1,
    });
    setIsCourseModalOpen(true);
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/admin/learning-paths/${selectedPath.id}/courses`, {
        course_id: parseInt(courseFormData.course_id),
        sequence_order: parseInt(courseFormData.sequence_order),
      });
      setSuccess("Thêm khóa học vào lộ trình thành công");
      setTimeout(() => setSuccess(""), 3000);
      setIsCourseModalOpen(false);
      fetchPaths();
    } catch (err) {
      setError("Lỗi khi thêm khóa học");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRemoveCourse = async (pathId, courseId) => {
    if (!window.confirm("Bạn muốn xóa khóa học này khỏi lộ trình?")) return;
    try {
      await api.delete(`/api/v1/admin/learning-paths/${pathId}/courses/${courseId}`);
      setSuccess("Đã xóa khóa học khỏi lộ trình");
      setTimeout(() => setSuccess(""), 3000);
      fetchPaths();
    } catch (err) {
      setError("Lỗi khi xóa khóa học");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Quản lý Lộ trình học tập</h1>
          <p className="text-slate-400 text-sm mt-1">Xây dựng định hướng học tập cho học viên</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Tạo lộ trình mới
        </button>
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

      {loading ? (
        <div className="text-center py-10 text-slate-400">Đang tải dữ liệu...</div>
      ) : paths.length === 0 ? (
        <div className="text-center py-20 bg-[#161b22] border border-slate-800 rounded-xl">
          <p className="text-slate-400">Chưa có lộ trình nào. Hãy tạo lộ trình đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {paths.map((path) => (
            <div key={path.id} className="bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                    {path.thumbnail_url ? (
                      <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No img</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{path.title}</h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{path.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(path)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-800/50 hover:bg-slate-800 rounded-md">
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(path.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-800/50 hover:bg-slate-800 rounded-md">
                    Xóa
                  </button>
                </div>
              </div>
              
              <div className="p-6 bg-[#0d1117] flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-slate-300">Các khóa học trong lộ trình ({path.courses?.length || 0})</h4>
                  <button onClick={() => handleOpenCourseModal(path)} className="text-xs text-blue-500 hover:text-blue-400">
                    + Thêm khóa học
                  </button>
                </div>
                
                <div className="space-y-3">
                  {path.courses && path.courses.sort((a,b) => a.sequence_order - b.sequence_order).map((pc) => (
                    <div key={pc.id} className="flex justify-between items-center p-3 bg-[#161b22] border border-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {pc.sequence_order}
                        </div>
                        <div className="text-sm text-slate-300 font-medium truncate max-w-[200px]">
                          {pc.course?.title || `Course #${pc.course_id}`}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveCourse(path.id, pc.course_id)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Gỡ
                      </button>
                    </div>
                  ))}
                  {(!path.courses || path.courses.length === 0) && (
                    <div className="text-xs text-slate-500 text-center py-2">
                      Lộ trình này chưa có khóa học nào
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Lộ Trình */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-100">
                {selectedPath ? "Sửa Lộ Trình" : "Tạo Lộ Trình Mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên lộ trình</label>
                <input
                  required
                  type="text"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mô tả</label>
                <textarea
                  rows="3"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL Hình thu nhỏ (Thumbnail)</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                  Lưu lộ trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Khóa học */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100">
                Thêm khóa học vào "{selectedPath?.title}"
              </h2>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Chọn khóa học</label>
                <select
                  required
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={courseFormData.course_id}
                  onChange={(e) => setCourseFormData({ ...courseFormData, course_id: e.target.value })}
                >
                  <option value="" disabled>-- Chọn khóa học --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Thứ tự học (Sequence)</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={courseFormData.sequence_order}
                  onChange={(e) => setCourseFormData({ ...courseFormData, sequence_order: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                  Thêm vào
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningPaths;
