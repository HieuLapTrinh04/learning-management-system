import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateCertificate } from './certificateSlice';
import { Award, BookOpen, Download, Eye, Award as CertIcon, Loader2, AlertCircle, Calendar, RefreshCw, CheckCircle2, FileText, X } from 'lucide-react';
import axios from 'axios';

export default function StudentCertificates({ token }) {
  const dispatch = useDispatch();
  const { isGenerating, error } = useSelector((state) => state.certificate);

  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // State for preview modal
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchEnrollments = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await axios.get('/api/v1/student/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setEnrollments(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Không thể tải danh sách khóa học');
      }
    } catch (err) {
      console.error(err);
      setLoadError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách khóa học');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEnrollments();
    }
  }, [token]);

  const handleGenerate = async (courseId) => {
    if (isGenerating) return;
    try {
      const result = await dispatch(generateCertificate({ courseId, token })).unwrap();
      alert('Yêu cầu cấp chứng chỉ thành công!');
      fetchEnrollments(); // Refresh list to fetch preloaded certificate details
    } catch (err) {
      console.error(err);
      alert(err || 'Đã xảy ra lỗi khi tạo chứng chỉ. Vui lòng đảm bảo bạn đã vượt qua tất cả bài kiểm tra của khóa học!');
    }
  };

  const completedCourses = enrollments.filter(e => e.progress_percentage === 100);

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang kiểm tra tiến độ học tập và chứng chỉ...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 max-w-2xl mx-auto my-10">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold">Lỗi đồng bộ</p>
          <p>{loadError}</p>
          <button 
            onClick={fetchEnrollments} 
            className="flex items-center gap-1 text-amber-500 font-bold hover:underline mt-2"
          >
            <RefreshCw className="w-3 h-3" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Chứng Chỉ Của Tôi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nhận văn bằng tốt nghiệp chứng nhận hoàn thành khóa học sau khi đạt 100% học liệu.
          </p>
        </div>
        <button
          onClick={fetchEnrollments}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
          title="Tải lại dữ liệu"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {completedCourses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-900 rounded-3xl bg-slate-950/10 max-w-2xl mx-auto">
          <Award className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-400">Bạn chưa đủ điều kiện cấp chứng chỉ nào</p>
          <p className="text-xs text-slate-500 mt-1.5 px-6 leading-relaxed">
            Để nhận chứng chỉ, bạn cần hoàn thành <strong>100% tiến độ học tập</strong>, <strong>vượt qua tất cả các bài kiểm tra (Quiz)</strong> và <strong>nộp đầy đủ bài tập tự luận</strong> của khóa học.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedCourses.map((enrollment) => {
            const hasCert = enrollment.certificate && enrollment.certificate.file_url;
            const cert = enrollment.certificate;
            
            return (
              <div 
                key={enrollment.id}
                className="bg-slate-900/30 border border-slate-900 hover:border-slate-850 transition rounded-2xl p-5 md:p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Đã hoàn thành 100%
                    </span>
                    {hasCert && (
                      <span className="text-[9px] font-mono text-slate-500">
                        Mã: {cert.certificate_code}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-slate-200 leading-snug line-clamp-2">
                      {enrollment.course?.title || 'Khóa học của tôi'}
                    </h3>
                    <p className="text-xs text-slate-550">
                      Giảng viên: {enrollment.course?.teacher?.name || 'Đội ngũ LMS'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {hasCert ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Cấp ngày: {new Date(cert.issued_at).toLocaleDateString('vi-VN')}</span>
                      </span>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setSelectedCert({
                            code: cert.certificate_code,
                            studentName: enrollment.student?.name || 'Học viên LMS',
                            courseTitle: enrollment.course?.title || '',
                            issuedAt: new Date(cert.issued_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }),
                            fileUrl: cert.file_url
                          })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chứng chỉ</span>
                        </button>
                        <a
                          href={cert.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#0b0e17] hover:bg-slate-950 border border-slate-800 hover:border-slate-750 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải PDF</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex justify-between items-center gap-4">
                      <span className="text-[11px] text-slate-400 italic">Chưa cấp chứng nhận</span>
                      <button
                        onClick={() => handleGenerate(enrollment.course_id)}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold rounded-xl text-xs flex items-center gap-1.5 transition duration-200"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tạo PDF...</span>
                          </>
                        ) : (
                          <>
                            <CertIcon className="w-3.5 h-3.5 text-slate-950" />
                            <span>Nhận chứng chỉ</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Elegant Preview Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FCFBF9] text-slate-850 rounded-3xl w-full max-w-4xl p-6 md:p-10 border-[10px] border-double border-[#C5A880] relative shadow-2xl relative overflow-hidden animate-scaleIn">
            
            {/* Ambient gold corners */}
            <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-[#C5A880]"></div>
            <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-[#C5A880]"></div>
            <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-[#C5A880]"></div>
            <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-[#C5A880]"></div>

            {/* Close button */}
            <button 
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition bg-slate-200/50 p-1.5 rounded-full z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate content mock */}
            <div className="text-center py-6 flex flex-col justify-between h-[450px] items-center">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A88B58]">Chứng nhận hoàn thành khóa học</span>
                <div className="w-12 h-[1px] bg-[#C5A880] mx-auto my-2"></div>
                <h1 className="font-serif text-3xl font-black tracking-wide text-slate-950 italic">CHỨNG CHỈ TỐT NGHIỆP</h1>
                <p className="text-[10px] italic text-slate-450 mt-1">Chứng nhận này được trao tặng trang trọng cho</p>
              </div>

              <div className="my-3">
                <h3 className="font-serif text-3xl font-bold text-[#A88B58] border-b border-[#EADFC9] px-6 py-1 inline-block italic">
                  {selectedCert.studentName}
                </h3>
              </div>

              <div className="max-w-xl px-4 space-y-2">
                <p className="text-xs text-slate-500">
                  Đã hoàn thành xuất sắc toàn bộ chương trình đào tạo của khóa học trực tuyến chất lượng cao:
                </p>
                <h4 className="font-serif text-xl font-bold text-slate-900 tracking-wide">
                  {selectedCert.courseTitle}
                </h4>
                <p className="text-[10px] text-slate-400">
                  được cung cấp bởi hệ thống Quản lý học tập trực tuyến Online LMS Platform.
                </p>
              </div>

              {/* Footer info inside preview */}
              <div className="w-full flex justify-between items-end px-8 mt-4 text-left">
                <div className="text-[9px] text-slate-400 font-mono space-y-0.5">
                  <p className="font-bold text-[#A88B58] uppercase tracking-wider">Xác thực chứng chỉ</p>
                  <p>Mã: {selectedCert.code}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Ngày cấp</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedCert.issuedAt}</p>
                </div>
                <div className="text-center">
                  <p className="font-serif italic text-lg text-[#A88B58] font-bold leading-none mb-0.5">Hieu Lap Trinh</p>
                  <div className="w-20 h-[0.5px] bg-slate-300 mx-auto"></div>
                  <p className="text-[8px] uppercase tracking-wider text-slate-400 mt-0.5">Giảng viên hướng dẫn</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <a
                href={selectedCert.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Tải xuống bản PDF gốc</span>
              </a>
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
