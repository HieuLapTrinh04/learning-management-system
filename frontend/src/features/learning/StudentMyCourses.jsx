import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  PlayCircle, 
  Clock, 
  BarChart3, 
  Award, 
  Loader2, 
  AlertCircle,
  GraduationCap,
  CheckCircle,
  Layers,
  RefreshCw,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function StudentMyCourses({ 
  token, 
  myEnrollments, 
  setMyEnrollments, 
  isLoadingEnrollments, 
  setIsLoadingEnrollments,
  onStartLearning 
}) {
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMyEnrollments = async () => {
    setIsLoadingEnrollments(true);
    setErrorMsg('');
    try {
      const response = await axios.get('/api/v1/student/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        setMyEnrollments(response.data.data || []);
      } else {
        throw new Error('Không thể tải danh sách khóa học.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi hệ thống.');
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyEnrollments();
    }
  }, [token]);

  // Stats
  const totalCourses = myEnrollments.length;
  const completedCourses = myEnrollments.filter(e => e.progress_percentage === 100).length;
  const inProgressCourses = myEnrollments.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100).length;
  const avgProgress = totalCourses > 0 
    ? Math.round(myEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalCourses) 
    : 0;

  if (isLoadingEnrollments && myEnrollments.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang tải danh sách khóa học đã đăng ký...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2 sm:gap-3">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
            <span>Khóa Học Của Tôi</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5">Quản lý và theo dõi tiến trình học tập trực tuyến của bạn.</p>
        </div>
        <button 
          onClick={fetchMyEnrollments}
          disabled={isLoadingEnrollments}
          className="py-2 px-3 sm:py-2.5 sm:px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 transition duration-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoadingEnrollments ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{errorMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
            <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div>
            <span className="text-[9px] lg:text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Tổng khóa học</span>
            <h3 className="text-lg lg:text-2xl font-extrabold text-slate-200 font-mono">{totalCourses}</h3>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 flex-shrink-0">
            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div>
            <span className="text-[9px] lg:text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Đang học</span>
            <h3 className="text-lg lg:text-2xl font-extrabold text-slate-200 font-mono">{inProgressCourses}</h3>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div>
            <span className="text-[9px] lg:text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Hoàn thành</span>
            <h3 className="text-lg lg:text-2xl font-extrabold text-slate-200 font-mono">{completedCourses}</h3>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-3 lg:p-5 flex items-center gap-3 lg:gap-4">
          <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 flex-shrink-0">
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div>
            <span className="text-[9px] lg:text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">TB Tiến độ</span>
            <h3 className="text-lg lg:text-2xl font-extrabold text-slate-200 font-mono">{avgProgress}%</h3>
          </div>
        </div>
      </div>

      {/* Enrollment Grid */}
      {myEnrollments.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-12 text-center space-y-4">
          <GraduationCap className="w-14 h-14 text-slate-800 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300">Bạn chưa đăng ký khóa học nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Hãy khám phá danh mục khóa học và bắt đầu hành trình học tập của bạn ngay hôm nay!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {myEnrollments.map((enrollment) => {
            const progress = enrollment.progress_percentage || 0;
            const isCompleted = progress === 100;
            const courseTitle = enrollment.course?.title || `Khóa học #${enrollment.course_id}`;
            const teacherName = enrollment.course?.teacher?.name || 'Giảng viên';
            const thumbnail = enrollment.course?.thumbnail_url;
            const enrolledAt = enrollment.created_at ? new Date(enrollment.created_at).toLocaleDateString('vi-VN') : '';

            // Count completed lessons from preloaded data
            const completedLessons = enrollment.lesson_progresses 
              ? enrollment.lesson_progresses.filter(lp => lp.is_completed).length 
              : 0;

            return (
              <div 
                key={enrollment.id} 
                className="bg-slate-900/40 border border-slate-900 hover:border-amber-500/20 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 flex flex-col"
              >
                {/* Thumbnail / Banner */}
                <div className="relative h-36 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                  {thumbnail ? (
                    <img src={thumbnail} alt={courseTitle} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-slate-800" />
                    </div>
                  )}
                  
                  {/* Progress badge overlay */}
                  <div className="absolute top-3 right-3">
                    {isCompleted ? (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                        <Award className="w-3 h-3" />
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full backdrop-blur-sm font-mono">
                        {progress}%
                      </span>
                    )}
                  </div>

                  {/* Hover play overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => onStartLearning(enrollment.course_id)}
                      className="w-14 h-14 rounded-full bg-amber-500/90 hover:bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 transition transform hover:scale-110"
                    >
                      <PlayCircle className="w-7 h-7" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-amber-100 transition-colors">
                      {courseTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <GraduationCap className="w-3 h-3" />
                      <span>{teacherName}</span>
                      {enrolledAt && (
                        <>
                          <span className="text-slate-700">•</span>
                          <Clock className="w-3 h-3" />
                          <span>{enrolledAt}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-semibold">Tiến trình</span>
                      <span className="font-bold font-mono text-amber-500">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                      <div 
                        style={{ width: `${progress}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20'}`}
                      ></div>
                    </div>
                    {completedLessons > 0 && (
                      <span className="text-[9px] text-slate-500 font-mono block text-right">
                        {completedLessons} bài học đã hoàn thành
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <button 
                    onClick={() => onStartLearning(enrollment.course_id)}
                    className={`w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{isCompleted ? 'Ôn tập lại' : 'Tiếp tục học'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivational Footer */}
      <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4 text-[10px] text-slate-500 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500/50 flex-shrink-0" />
        <p>Hoàn thành tất cả bài học trong khóa học để nhận chứng chỉ tốt nghiệp dạng PDF do hệ thống cấp phát tự động.</p>
      </div>

    </div>
  );
}
