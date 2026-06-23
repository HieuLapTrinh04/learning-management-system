import React from 'react';
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
import { Users, CheckCircle, Award, BarChart3, Folder, BookOpen, Star, CheckSquare, Clock } from 'lucide-react';

export default function TeacherDashboard({ data }) {
  const { 
    revenue_by_course, 
    student_count, 
    completion_rate,
    total_courses,
    average_quiz_score,
    assignment_stats
  } = data || {
    revenue_by_course: [],
    student_count: 0,
    completion_rate: 0,
    total_courses: 0,
    average_quiz_score: 0,
    assignment_stats: {
      total_assignments: 0,
      total_submissions: 0,
      graded_submissions: 0
    }
  };

  const safeRevenueByCourse = revenue_by_course || [];

  const chartData = safeRevenueByCourse.map((item) => ({
    name: item.course_title.length > 15 ? item.course_title.substring(0, 15) + '...' : item.course_title,
    'Doanh thu': item.revenue
  }));

  const formatCurrency = (val) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  // Color palette for bars
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  const pendingGradingCount = (assignment_stats?.total_submissions || 0) - (assignment_stats?.graded_submissions || 0);
  const gradingProgressPercentage = assignment_stats?.total_submissions > 0 
    ? Math.round((assignment_stats.graded_submissions * 100) / assignment_stats.total_submissions) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 4 Cards Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Student count */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 rounded-full blur-xl"></div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Học viên sở hữu</span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1 font-mono">{student_count}</h3>
            <p className="text-[9px] text-slate-550 mt-1">Học sinh đăng ký khóa học của bạn.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Course count */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 rounded-full blur-xl"></div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tổng số khóa học</span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1 font-mono">{total_courses}</h3>
            <p className="text-[9px] text-slate-550 mt-1">Lớp học bạn đang biên soạn giáo án.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 flex items-center justify-center text-slate-300 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 rounded-full blur-xl"></div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tỷ lệ hoàn thành</span>
            <h3 className="text-3xl font-extrabold text-brand-500 mt-1 font-mono">
              {completion_rate ? completion_rate.toFixed(1) : 0}%
            </h3>
            <p className="text-[9px] text-slate-550 mt-1">Số học viên học xong 100% học liệu.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 rounded-full blur-xl"></div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Điểm thi trung bình</span>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1 font-mono">
              {average_quiz_score ? average_quiz_score.toFixed(1) : 0}%
            </h3>
            <p className="text-[9px] text-slate-550 mt-1">Điểm đạt trung bình bài trắc nghiệm.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 flex items-center justify-center text-amber-500 flex-shrink-0">
            <Star className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Charts & Table layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart of Course Revenues */}
        <div className="lg:col-span-2 p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-350">Phân tích doanh thu khóa học</h3>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Chưa phát sinh doanh thu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} maxBarSize={45}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', color: '#f59e0b' }}
                    formatter={(v) => formatCurrency(v)}
                  />
                  <Bar dataKey="Doanh thu" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed course revenue logs table */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Folder className="w-4 h-4 text-brand-500" />
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-355">Bảng kê chi tiết</h3>
            </div>
            
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {safeRevenueByCourse.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-550">Chưa có dữ liệu khóa học</div>
              ) : (
                safeRevenueByCourse.map((c) => (
                  <div 
                    key={c.course_id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center gap-4 hover:border-slate-850 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-200 truncate">{c.course_title}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mã: #{c.course_id}</p>
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-500 flex-shrink-0">
                      {formatCurrency(c.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 text-center border-t border-slate-900/50 pt-3 mt-4">
            Doanh thu tự động cập nhật sau khi VNPay hoàn tất lệnh IPN.
          </div>
        </div>

      </div>

      {/* Assignment Grading Statistics Section */}
      <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-350">Tiến trình chấm điểm tự luận</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Progress bar and completeness ratio */}
          <div className="bg-slate-950/50 border border-slate-900 p-4 rounded-xl space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Tỷ lệ hoàn thành chấm bài</span>
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-300">
              <span>Tiến độ</span>
              <span>{gradingProgressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${gradingProgressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Counts stats column */}
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <div className="bg-slate-950/50 border border-slate-900 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">Tổng số bài tập</span>
              <span className="text-xl font-extrabold text-slate-200 block mt-1 font-mono">
                {assignment_stats?.total_assignments || 0}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-900 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">Bài đã nộp</span>
              <span className="text-xl font-extrabold text-slate-200 block mt-1 font-mono">
                {assignment_stats?.total_submissions || 0}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-900 p-4 rounded-xl text-center">
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">Chưa chấm điểm</span>
              <span className="text-xl font-extrabold text-amber-500 block mt-1 font-mono">
                {pendingGradingCount}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
