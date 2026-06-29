import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  BookOpen,
  CheckCircle,
  Award,
  TrendingUp,
  PlayCircle,
  Clock,
  ClipboardList,
  CheckSquare,
  Check,
  X as XIcon,
  HelpCircle,
  FileText,
  Star,
  ShieldCheck,
  Flame
} from 'lucide-react';

export default function StudentDashboard({ data, onStartLearning }) {
  const [gamification, setGamification] = useState({ points: 0, badges: [] });

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const token = localStorage.getItem('lms_token');
        const res = await axios.get('/api/v1/student/gamification/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setGamification(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin gamification', err);
      }
    };
    fetchGamification();
  }, []);
  // Extract and default fields from backend StudentStats DTO
  const enrolledCount = data?.enrolled_courses_count || 0;
  const completedCount = data?.completed_courses_count || 0;
  const certsCount = data?.certificates_count || 0;
  const progressList = data?.course_progresses || [];
  const quizResults = data?.quiz_results || [];
  const assignmentResults = data?.assignment_results || [];

  // Map progress list for BarChart
  const progressData = progressList.map(e => ({
    name: e.course_title ? (e.course_title.length > 18 ? e.course_title.substring(0, 18) + '...' : e.course_title) : `Khóa học #${e.course_id}`,
    progress: e.progress_percentage || 0
  }));

  // Calculate average learning progress
  let sumProgress = 0;
  progressList.forEach(e => {
    sumProgress += e.progress_percentage || 0;
  });
  const averageProgress = enrolledCount > 0 ? Math.round(sumProgress / enrolledCount) : 0;

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-12">

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">

        {/* Enrolled Courses */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-4 lg:p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-2">
              <span className="text-slate-400 text-[10px] lg:text-xs font-semibold tracking-wider uppercase block">Đang đăng ký</span>
              <h3 className="text-xl lg:text-3xl font-extrabold text-slate-100 font-mono">
                {enrolledCount}
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-500">Khóa học bạn đã sở hữu quyền học tập.</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-850 flex items-center justify-center text-slate-350 flex-shrink-0">
              <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-4 lg:p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-2">
              <span className="text-slate-400 text-[10px] lg:text-xs font-semibold tracking-wider uppercase block">Khóa học hoàn thành</span>
              <h3 className="text-xl lg:text-3xl font-extrabold text-slate-100 font-mono">
                {completedCount}
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-500">Khóa học đạt tiến độ 100% học liệu.</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-850 flex items-center justify-center text-slate-350 flex-shrink-0">
              <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-gradient-to-br from-brand-900/20 to-brand-500/10 border border-brand-500/20 shadow-xl rounded-2xl p-4 lg:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-2">
              <span className="text-slate-400 text-[10px] lg:text-xs font-semibold tracking-wider uppercase block">Tiến trình trung bình</span>
              <h3 className="text-xl lg:text-3xl font-extrabold text-brand-500 font-mono">
                {averageProgress}%
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-550">Phần trăm bài học đã xem trên tổng số lớp.</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>

        {/* Certificates count */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-4 lg:p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-2">
              <span className="text-slate-400 text-[10px] lg:text-xs font-semibold tracking-wider uppercase block">Chứng chỉ sở hữu</span>
              <h3 className="text-xl lg:text-3xl font-extrabold text-slate-100 font-mono">
                {certsCount}
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-500">Số văn bằng chứng nhận đã cấp thành công.</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-850 flex items-center justify-center text-slate-350 flex-shrink-0">
              <Award className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>

        {/* Gamification Points */}
        <div className="bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/20 shadow-xl rounded-2xl p-4 lg:p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-2">
              <span className="text-amber-500/80 text-[10px] lg:text-xs font-semibold tracking-wider uppercase block">Điểm thưởng</span>
              <h3 className="text-xl lg:text-3xl font-extrabold text-amber-500 font-mono">
                {gamification.points}
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-400">Tích lũy từ việc học và hoàn thành bài tập.</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
              <Star className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-900/40 to-slate-900 border border-orange-500/20 shadow-xl rounded-2xl p-4 lg:p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-2">
              <span className="text-orange-500/80 text-[10px] lg:text-xs font-semibold tracking-wider uppercase block">Chuỗi học tập</span>
              <h3 className="text-xl lg:text-3xl font-extrabold text-orange-500 font-mono">
                {gamification.current_streak || 0} <span className="text-xs lg:text-sm font-normal text-orange-500/70">ngày</span>
              </h3>
              <p className="text-[9px] lg:text-[10px] text-slate-400">Kỷ lục: {gamification.highest_streak || 0} ngày liên tiếp.</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Flame className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Badges Section */}
      {gamification.badges && gamification.badges.length > 0 && (
        <div className="bg-[#0b0e17] border border-slate-900 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Huy hiệu của tôi</span>
          </h3>
          <div className="flex flex-wrap gap-4">
            {gamification.badges.map((ub, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3 w-64 hover:border-amber-500/50 transition">
                <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-500 line-clamp-1" title={ub.badge?.name}>{ub.badge?.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={ub.badge?.description}>{ub.badge?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress and Chart Panel */}
      {enrolledCount > 0 && (
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-355">Biểu đồ tiến độ học tập chi tiết (%)</h3>
          </div>
          <div className="h-48 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} maxBarSize={45}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '11px', color: '#f59e0b' }}
                  formatter={(v) => `${v}%`}
                />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Sections: Recent Courses, Quiz Attempts, and Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Span 2): Courses and Quiz Attempts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Courses List */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Khóa học đăng ký gần đây</h3>
            {progressList.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-900 rounded-2xl text-xs text-slate-500">
                Bạn chưa đăng ký khóa học nào. Hãy khám phá danh mục khóa học để bắt đầu học tập!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {progressList.map((e) => (
                  <div
                    key={e.course_id}
                    className="bg-slate-900/30 border border-slate-900 hover:border-slate-850 transition p-4 rounded-xl flex items-center justify-between gap-6"
                  >
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div>
                        <h4 className="font-serif font-bold text-slate-200 truncate">{e.course_title || `Khóa học #${e.course_id}`}</h4>
                        <p className="text-[10px] text-slate-550 mt-0.5">Mã số khóa học: {e.course_id}</p>
                      </div>

                      {/* Progress bar info */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                          <span>Tiến trình</span>
                          <span>{e.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                          <div
                            style={{ width: `${e.progress_percentage || 0}%` }}
                            className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-300"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartLearning(e.course_id)}
                      className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 hover:border-amber-500/40 text-slate-400 hover:text-amber-500 flex items-center justify-center flex-shrink-0 transition"
                      title="Vào lớp học"
                    >
                      <PlayCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quiz Results Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              <span>Kết quả bài trắc nghiệm gần đây</span>
            </h3>
            {quizResults.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/10 border border-slate-900 rounded-2xl text-xs text-slate-500">
                Bạn chưa thực hiện bài thi trắc nghiệm nào.
              </div>
            ) : (
              <div className="border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] sm:text-xs border-collapse min-w-[500px] sm:min-w-max">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 uppercase tracking-wider text-[8px] sm:text-[10px]">
                        <th className="p-2 sm:p-3">Bài kiểm tra / Khóa học</th>
                        <th className="p-2 sm:p-3 text-center">Điểm số cao nhất</th>
                        <th className="p-2 sm:p-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                  <tbody>
                    {quizResults.map((q, idx) => (
                      <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/20 transition">
                        <td className="p-2 sm:p-3">
                          <div className="font-bold text-slate-200 text-[10px] sm:text-xs">{q.quiz_title}</div>
                          <div className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5">{q.course_title}</div>
                        </td>
                        <td className="p-2 sm:p-3 text-center font-bold font-mono text-slate-350 text-xs sm:text-sm">
                          {q.score}%
                        </td>
                        <td className="p-2 sm:p-3 text-center min-w-[80px]">
                          {q.is_passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              <Check className="w-3 h-3" /> Đạt (Pass)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                              <XIcon className="w-3 h-3" /> Chưa Đạt (Fail)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Assignment Submissions */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span>Kết quả bài tập tự luận</span>
          </h3>
          {assignmentResults.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/10 border border-slate-900 rounded-2xl text-xs text-slate-500">
              Chưa ghi nhận bài nộp tự luận nào từ bạn.
            </div>
          ) : (
            <div className="space-y-4">
              {assignmentResults.map((a, idx) => (
                <div key={idx} className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-200 text-xs truncate" title={a.assignment_title}>
                        {a.assignment_title}
                      </h4>
                      <p className="text-[10px] text-slate-550 truncate mt-0.5">{a.course_title}</p>
                    </div>
                    {a.is_graded ? (
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-500 font-mono">{a.score}</span>
                        <span className="text-[10px] text-slate-500 font-mono">/{a.max_score} đ</span>
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
                        Đang chấm
                      </span>
                    )}
                  </div>

                  {a.is_graded && a.feedback ? (
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/50 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Lời phê của giảng viên:
                      </span>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">{a.feedback}</p>
                    </div>
                  ) : a.is_graded ? (
                    <p className="text-[9px] text-slate-500 italic">Giảng viên không để lại lời phê.</p>
                  ) : (
                    <p className="text-[9px] text-slate-550 italic">Bài làm đã được nộp. Vui lòng chờ phản hồi chấm điểm.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
