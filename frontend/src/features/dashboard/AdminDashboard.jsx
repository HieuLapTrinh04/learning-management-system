import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { DollarSign, Users, GraduationCap, BookOpen, TrendingUp, Activity, Award, Star } from 'lucide-react';

export default function AdminDashboard({ data }) {
  const { 
    total_revenue, 
    platform_revenue,
    teacher_payout,
    total_students, 
    total_teachers, 
    total_courses, 
    total_certificates,
    conversion_rate,
    monthly_revenue,
    student_growth,
    course_growth,
    top_courses
  } = data || {
    total_revenue: 0,
    platform_revenue: 0,
    teacher_payout: 0,
    total_students: 0,
    total_teachers: 0,
    total_courses: 0,
    total_certificates: 0,
    conversion_rate: 0,
    monthly_revenue: [],
    student_growth: [],
    course_growth: [],
    top_courses: []
  };

  // Format arrays for charts
  const revenueChartData = (monthly_revenue || []).map(r => ({
    name: r.month,
    'Doanh thu': r.revenue
  }));

  const growthChartData = (student_growth || []).map(g => ({
    name: g.month,
    'Học viên mới': g.count
  }));

  const courseGrowthChartData = (course_growth || []).map(g => ({
    name: g.month,
    'Khóa học mới': g.count
  }));

  // User breakdown data for PieChart
  const userData = [
    { name: 'Học viên', value: total_students || 0, color: '#f59e0b' }, // Amber-500
    { name: 'Giảng viên', value: total_teachers || 0, color: '#3b82f6' }  // Blue-500
  ];

  const formatCurrency = (val) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 6 Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-brand-900/20 to-brand-500/10 border border-brand-500/20 shadow-xl rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tổng doanh thu hệ thống</span>
              <h3 className="text-xl font-black text-brand-500 font-mono truncate">
                {formatCurrency(total_revenue)}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-brand-500/20 pt-3">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Doanh thu nền tảng</span>
              <p className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(platform_revenue)}</p>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">Đã trả giảng viên</span>
              <p className="text-xs font-bold text-amber-500 font-mono">{formatCurrency(teacher_payout)}</p>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tỷ lệ chuyển đổi mua hàng</span>
              <h3 className="text-2xl font-black text-slate-100 font-mono">
                {conversion_rate ? conversion_rate.toFixed(1) : 0}%
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-brand-500 flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tổng học viên</span>
              <h3 className="text-2xl font-black text-slate-100 font-mono">
                {total_students}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-slate-300 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tổng giảng viên</span>
              <h3 className="text-2xl font-black text-slate-100 font-mono">
                {total_teachers}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-slate-300 flex-shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Tổng khóa học</span>
              <h3 className="text-2xl font-black text-slate-100 font-mono">
                {total_courses}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-slate-300 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Certificates */}
        <div className="bg-slate-900/50 border border-slate-900 shadow-xl rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">Chứng chỉ đã cấp</span>
              <h3 className="text-2xl font-black text-slate-100 font-mono">
                {total_certificates}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-slate-350 flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Area Chart */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-350">Biểu đồ doanh thu hàng tháng</h3>
          </div>
          <div className="h-64 w-full">
            {revenueChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Chưa ghi nhận doanh thu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f59e0b', fontSize: '11px' }}
                    formatter={(v) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="Doanh thu" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Student Growth Registration Bar Chart */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-350">Lượng học viên mới đăng ký</h3>
          </div>
          <div className="h-64 w-full">
            {growthChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Chưa ghi nhận đăng ký mới</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} maxBarSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#3b82f6', fontSize: '11px' }}
                  />
                  <Bar dataKey="Học viên mới" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Course Growth Bar Chart */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-350">Lượng khóa học mới tạo</h3>
          </div>
          <div className="h-64 w-full">
            {courseGrowthChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Chưa ghi nhận khóa học mới</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseGrowthChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} maxBarSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981', fontSize: '11px' }}
                  />
                  <Bar dataKey="Khóa học mới" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Top Courses & User Structure Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Courses List Table */}
        <div className="lg:col-span-2 p-5 bg-slate-900/30 border border-slate-900 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-355">Khóa học hàng đầu (Top Courses)</h3>
          </div>
          
          {(top_courses || []).length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">Chưa có dữ liệu khóa học</div>
          ) : (
            <div className="border border-slate-900/50 rounded-xl overflow-hidden bg-slate-950/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Khóa học</th>
                    <th className="p-3 text-center">Số học viên</th>
                    <th className="p-3 text-center">Doanh thu tích lũy</th>
                  </tr>
                </thead>
                <tbody>
                  {(top_courses || []).map((course, idx) => (
                    <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/20 transition">
                      <td className="p-3 font-semibold text-slate-200">
                        {course.course_title}
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-slate-300 text-sm">
                        {course.enrollments}
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-amber-500 text-sm">
                        {formatCurrency(course.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Structure PieChart */}
        <div className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-350">Cơ cấu giảng dạy & Học viên</h3>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {total_students === 0 && total_teachers === 0 ? (
              <span className="text-xs text-slate-500">Chưa có người dùng</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', color: '#f8fafc' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={10} 
                    formatter={(value) => <span className="text-xs text-slate-400 font-semibold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-[10px] text-slate-500 text-center border-t border-slate-900/50 pt-3">
            Tỷ lệ phân bổ: {total_students > 0 && total_teachers > 0 ? (total_students / total_teachers).toFixed(1) : 0} học viên / giảng viên.
          </div>
        </div>

      </div>

    </div>
  );
}
