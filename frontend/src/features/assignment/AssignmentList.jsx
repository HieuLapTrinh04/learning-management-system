import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileUp,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ChevronRight,
  Award,
  Star,
  ClipboardList,
  Sparkles,
  Calendar,
  Target,
} from 'lucide-react';

/**
 * AssignmentList — Shared component for Student and Teacher.
 * 
 * For Student: fetches enrolled courses → sections → assignments, shows upload cards.
 * For Teacher: fetches own courses → sections → assignments, shows grading entry.
 *
 * Props:
 *   token: auth token
 *   role: 'student' | 'teacher'
 *   onSelectAssignment: 
 *     student → (assignmentObject) => void
 *     teacher → (assignmentId, assignmentTitle) => void
 */
export default function AssignmentList({ token, role, onSelectAssignment }) {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAssignments = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const assignmentList = [];

      if (role === 'student') {
        // Get enrolled courses, then each course's sections/assignments
        const enrollRes = await axios.get('/api/v1/student/enrollments/my-courses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (enrollRes.data?.success) {
          const enrollments = enrollRes.data.data || [];
          for (const enrollment of enrollments) {
            try {
              const courseRes = await axios.get(`/api/v1/courses/${enrollment.course_id}`);
              if (courseRes.data?.success) {
                const course = courseRes.data.data;
                if (course.sections) {
                  for (const section of course.sections) {
                    if (section.assignments && section.assignments.length > 0) {
                      for (const a of section.assignments) {
                        assignmentList.push({
                          ...a,
                          course_title: course.title,
                          section_title: section.title,
                        });
                      }
                    }
                  }
                }
              }
            } catch { /* skip */ }
          }
        }
      } else {
        // Teacher: fetch own courses from teacher courses API
        try {
          const coursesRes = await axios.get('/api/v1/teacher/courses', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (coursesRes.data?.success) {
            const courses = coursesRes.data.data || [];
            for (const c of courses) {
              try {
                const courseRes = await axios.get(`/api/v1/courses/${c.id}`);
                if (courseRes.data?.success) {
                  const course = courseRes.data.data;
                  if (course.sections) {
                    for (const section of course.sections) {
                      if (section.assignments && section.assignments.length > 0) {
                        for (const a of section.assignments) {
                          assignmentList.push({
                            ...a,
                            course_title: course.title,
                            section_title: section.title,
                          });
                        }
                      }
                    }
                  }
                }
              } catch { /* skip */ }
            }
          }
        } catch { /* skip */ }
      }

      setAssignments(assignmentList);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAssignments();
  }, [token]);

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang tải danh sách bài tập...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 border border-slate-900 p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-100 flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-amber-500" />
            <span>{role === 'teacher' ? 'Chấm Bài Tập' : 'Bài Tập Của Tôi'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'teacher'
              ? 'Xem các bài nộp và chấm điểm, phản hồi kết quả cho sinh viên.'
              : 'Nộp bài tập qua Cloudinary và theo dõi kết quả chấm điểm.'}
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
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

      {/* Empty state */}
      {assignments.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-12 text-center space-y-4">
          <FileUp className="w-14 h-14 text-slate-800 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-300">Chưa có bài tập nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {role === 'teacher'
                ? 'Tạo bài tập từ tab Biên Soạn Giáo Án để sinh viên có thể nộp bài.'
                : 'Bài tập sẽ xuất hiện khi giảng viên tạo assignment cho khóa học của bạn.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assignments.map((assignment) => {
            const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
            const dueDate = assignment.due_date
              ? new Date(assignment.due_date).toLocaleDateString('vi-VN')
              : '—';

            return (
              <div
                key={assignment.id}
                className="bg-slate-900/40 border border-slate-900 hover:border-amber-500/20 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
              >
                {/* Top banner */}
                <div className={`h-2 ${isOverdue ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400'}`}></div>

                <div className="p-6 space-y-4">
                  {/* Title */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                      isOverdue 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-sky-500/10 border-sky-500/20 text-sky-500'
                    }`}>
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-amber-100 transition-colors">
                        {assignment.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{assignment.course_title}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {assignment.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{assignment.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-2 text-center">
                      <Target className="w-3 h-3 text-amber-500 mx-auto" />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {assignment.max_score || 10} điểm
                      </span>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-2 text-center">
                      <Calendar className="w-3 h-3 text-sky-500 mx-auto" />
                      <span className={`text-[10px] block mt-1 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                        {dueDate}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-2 text-center">
                      <BookOpen className="w-3 h-3 text-emerald-500 mx-auto" />
                      <span className="text-[10px] text-slate-400 block mt-1 truncate">
                        {assignment.section_title || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Status tag */}
                  {isOverdue && (
                    <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full text-center font-semibold">
                      Đã quá hạn nộp
                    </div>
                  )}

                  {/* Action */}
                  <button
                    onClick={() => {
                      if (role === 'teacher') {
                        onSelectAssignment(assignment.id, assignment.title);
                      } else {
                        onSelectAssignment(assignment);
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition duration-300 shadow-lg ${
                      role === 'teacher'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-amber-500/10'
                        : 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-slate-950 shadow-sky-500/10'
                    }`}
                  >
                    {role === 'teacher' ? (
                      <>
                        <Star className="w-4 h-4" />
                        <span>Xem bài nộp & Chấm điểm</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-4 h-4" />
                        <span>Nộp bài tập</span>
                      </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4 text-[10px] text-slate-500 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500/50 flex-shrink-0" />
        <p>
          {role === 'teacher'
            ? 'Kết quả chấm điểm và phản hồi sẽ được gửi đến sinh viên qua hệ thống thông báo.'
            : 'Tệp bài tập sẽ được tải lên Cloudinary CDN. Giảng viên sẽ chấm điểm và phản hồi kết quả.'}
        </p>
      </div>
    </div>
  );
}
