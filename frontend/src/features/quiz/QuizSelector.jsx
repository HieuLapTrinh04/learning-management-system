import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardCheck,
  Target,
  Clock,
  Zap,
  Loader2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Layers,
  Award,
  Sparkles,
} from 'lucide-react';

export default function QuizSelector({ token, onSelectQuiz }) {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchQuizzes = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Get enrolled courses, each course has sections, and sections can have quizzes
      const enrollRes = await axios.get('/api/v1/student/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (enrollRes.data && enrollRes.data.success) {
        const myEnrollments = enrollRes.data.data || [];

        // For each enrollment, fetch course details to get sections with quizzes
        const quizList = [];
        for (const enrollment of myEnrollments) {
          try {
            const courseRes = await axios.get(`/api/v1/courses/${enrollment.course_id}`);
            if (courseRes.data && courseRes.data.success) {
              const course = courseRes.data.data;
              if (course.sections) {
                for (const section of course.sections) {
                  if (section.quizzes && section.quizzes.length > 0) {
                    for (const quiz of section.quizzes) {
                      quizList.push({
                        ...quiz,
                        course_title: course.title,
                        section_title: section.title,
                      });
                    }
                  }
                }
              }
            }
          } catch (err) {
            // Skip courses that fail to load
            console.warn('Failed to load course', enrollment.course_id, err);
          }
        }
        setEnrollments(quizList);
      } else {
        throw new Error('Không thể tải danh sách.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuizzes();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang tải danh sách bài kiểm tra...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 border border-slate-900 p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-100 flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-amber-500" />
            <span>Bài Kiểm Tra</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Hoàn thành các bài kiểm tra để đánh giá mức độ tiếp thu kiến thức.</p>
        </div>
        <button
          onClick={fetchQuizzes}
          disabled={isLoading}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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

      {/* Quiz list */}
      {enrollments.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-12 text-center space-y-4">
          <Target className="w-14 h-14 text-slate-800 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300">Chưa có bài kiểm tra</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Các bài kiểm tra sẽ xuất hiện khi giảng viên tạo quiz cho các khóa học bạn đã đăng ký.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {enrollments.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900/40 border border-slate-900 hover:border-amber-500/20 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
            >
              {/* Top banner gradient */}
              <div className="h-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400"></div>

              <div className="p-6 space-y-4">
                {/* Quiz info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-amber-100 transition-colors">
                        {quiz.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{quiz.course_title}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-2 text-center">
                    <Zap className="w-3 h-3 text-amber-500 mx-auto" />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {quiz.questions?.length || '—'} câu
                    </span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-2 text-center">
                    <Award className="w-3 h-3 text-emerald-500 mx-auto" />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {quiz.passing_score}% đạt
                    </span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-2 text-center">
                    <Layers className="w-3 h-3 text-sky-500 mx-auto" />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {quiz.max_attempts} lần
                    </span>
                  </div>
                </div>

                {/* Section info */}
                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  <span className="truncate">{quiz.section_title}</span>
                </div>

                {/* Action */}
                <button
                  onClick={() => onSelectQuiz(quiz.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-[11px] flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
                >
                  <Target className="w-4 h-4" />
                  <span>Bắt đầu làm bài</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4 text-[10px] text-slate-500 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500/50 flex-shrink-0" />
        <p>Kết quả bài kiểm tra sẽ được ghi nhận trong hệ thống và giảng viên có thể theo dõi tiến trình của bạn.</p>
      </div>
    </div>
  );
}
