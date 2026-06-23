import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSubmissions, gradeSubmission, resetGrading } from './assignmentSlice';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  ExternalLink,
  Star,
  Send,
  MessageSquare,
  Award,
  XCircle,
  RefreshCw,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

export default function TeacherGrading({ assignmentId, assignmentTitle, token: propToken, onBack }) {
  const token = propToken || localStorage.getItem('lms_token') || '';
  const dispatch = useDispatch();
  const { submissions, submissionsPhase, submissionsError, gradingPhase, gradingError } = useSelector(
    (s) => s.assignment
  );

  // Grading modal state
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  useEffect(() => {
    if (assignmentId && token) {
      dispatch(fetchSubmissions({ assignmentId, token }));
    }
  }, [assignmentId, token, dispatch]);

  // Reset grading on success
  useEffect(() => {
    if (gradingPhase === 'success') {
      setTimeout(() => {
        setActiveSubmission(null);
        setGradeScore('');
        setGradeFeedback('');
        dispatch(resetGrading());
      }, 1500);
    }
  }, [gradingPhase, dispatch]);

  const handleGrade = () => {
    if (!activeSubmission || gradeScore === '') return;
    dispatch(
      gradeSubmission({
        submissionId: activeSubmission.id,
        score: parseInt(gradeScore, 10),
        feedback: gradeFeedback,
        token,
      })
    );
  };

  // Stats
  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter((s) => s.score !== null && s.score !== undefined).length;
  const ungradedCount = totalSubmissions - gradedCount;
  const avgScore =
    gradedCount > 0
      ? Math.round(submissions.filter((s) => s.score != null).reduce((sum, s) => sum + s.score, 0) / gradedCount)
      : 0;

  if (submissionsPhase === 'loading') {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang tải danh sách bài nộp...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-amber-500 uppercase tracking-widest transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Quay lại</span>
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 border border-slate-900 p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-xl font-bold text-slate-100 flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            <span>Chấm điểm: {assignmentTitle || `Bài tập #${assignmentId}`}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Xem bài nộp và chấm điểm, gửi phản hồi cho sinh viên.</p>
        </div>
        <button
          onClick={() => dispatch(fetchSubmissions({ assignmentId, token }))}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Error */}
      {submissionsError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{submissionsError}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Tổng bài nộp</span>
            <h3 className="text-2xl font-extrabold text-slate-200 font-mono">{totalSubmissions}</h3>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Đã chấm</span>
            <h3 className="text-2xl font-extrabold text-slate-200 font-mono">{gradedCount}</h3>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Chưa chấm</span>
            <h3 className="text-2xl font-extrabold text-slate-200 font-mono">{ungradedCount}</h3>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Điểm TB</span>
            <h3 className="text-2xl font-extrabold text-slate-200 font-mono">{avgScore}</h3>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {totalSubmissions === 0 ? (
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-12 text-center space-y-4">
          <FileText className="w-14 h-14 text-slate-800 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300">Chưa có sinh viên nộp bài</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Sinh viên sẽ nộp bài tập thông qua giao diện học trực tuyến.</p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/50">
                  <th className="p-4 font-semibold">Sinh viên</th>
                  <th className="p-4 font-semibold">Tệp nộp</th>
                  <th className="p-4 font-semibold">Ngày nộp</th>
                  <th className="p-4 font-semibold text-center">Điểm</th>
                  <th className="p-4 font-semibold">Phản hồi</th>
                  <th className="p-4 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const isGraded = sub.score !== null && sub.score !== undefined;
                  return (
                    <tr key={sub.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 block">{sub.student?.name || `SV #${sub.student_id}`}</span>
                            <span className="text-[10px] text-slate-500">{sub.student?.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {sub.file_url ? (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="underline truncate max-w-[120px]">Xem tệp</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[10px]">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="p-4 text-center">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-mono">
                            <Star className="w-3 h-3 fill-current" />
                            {sub.score}
                          </span>
                        ) : (
                          <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">
                            Chờ chấm
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {sub.feedback ? (
                          <p className="text-slate-400 line-clamp-2 max-w-[200px] text-[11px] leading-relaxed">{sub.feedback}</p>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setActiveSubmission(sub);
                            setGradeScore(sub.score != null ? String(sub.score) : '');
                            setGradeFeedback(sub.feedback || '');
                            dispatch(resetGrading());
                          }}
                          className="py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg transition flex items-center gap-1.5 mx-auto"
                        >
                          <Star className="w-3 h-3" />
                          <span>{isGraded ? 'Sửa điểm' : 'Chấm điểm'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>

            <div className="p-6 sm:p-8 space-y-5 relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Chấm điểm bài nộp</span>
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    {activeSubmission.student?.name || `Sinh viên #${activeSubmission.student_id}`}
                  </p>
                </div>
                <button
                  onClick={() => { setActiveSubmission(null); dispatch(resetGrading()); }}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* File link */}
              {activeSubmission.file_url && (
                <a
                  href={activeSubmission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-sky-400 hover:text-sky-300 transition"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate underline">Mở tệp bài nộp trên Cloudinary</span>
                </a>
              )}

              {/* Grade success */}
              {gradingPhase === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-2 text-emerald-400 items-center text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">Đã lưu điểm và phản hồi thành công!</span>
                </div>
              )}

              {/* Grade error */}
              {gradingError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-2 text-red-400 items-start text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{gradingError}</span>
                </div>
              )}

              {/* Score input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Điểm số
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500/50 transition"
                  />
                </div>
              </div>

              {/* Feedback textarea */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  Phản hồi giảng viên
                </label>
                <textarea
                  rows={4}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Nhận xét chi tiết về bài làm của sinh viên..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-amber-500/50 transition resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setActiveSubmission(null); dispatch(resetGrading()); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleGrade}
                  disabled={gradeScore === '' || gradingPhase === 'grading'}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {gradingPhase === 'grading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Xác nhận chấm điểm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4 text-[10px] text-slate-500 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500/50 flex-shrink-0" />
        <p>Phản hồi chấm điểm sẽ được gửi qua hệ thống thông báo thời gian thực đến sinh viên.</p>
      </div>
    </div>
  );
}
