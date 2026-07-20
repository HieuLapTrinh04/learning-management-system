import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Play, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Video, 
  Loader2, 
  AlertCircle,
  Award,
  Sparkles,
  Lock,
  Menu,
  X,
  Volume2,
  Maximize2,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import ReactPlayer from 'react-player';
import YouTube from 'react-youtube';
import QuizPlayer from '../quiz/QuizPlayer';
import StudentAssignment from '../assignment/StudentAssignment';
import LessonDiscussion from './LessonDiscussion';
import LessonAttachments from './LessonAttachments';
import LessonNotes from './LessonNotes';

export default function LearningCenter({ courseId, token: propToken, onBack }) {
  const token = propToken || localStorage.getItem('lms_token') || '';
  
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [completedLessonsMap, setCompletedLessonsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, qna, attachments

  // Action states
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);

  // Video controller states (mock controls for custom look)
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentVideoSeconds, setCurrentVideoSeconds] = useState(0);
  const videoRef = React.useRef(null);

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.seekTo(time, 'seconds');
    }
    setCurrentVideoSeconds(time);
  };

  const fetchLearningData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Get Course Syllabus
      const courseRes = await axiosClient.get(`/api/v1/courses/${courseId}`);
      if (!courseRes.data || !courseRes.data.success) {
        throw new Error('Không thể tải giáo trình khóa học.');
      }
      const courseData = courseRes.data.data;
      setCourse(courseData);

      // Expand sections by default
      if (courseData.sections && courseData.sections.length > 0) {
        const expands = {};
        courseData.sections.forEach(s => {
          expands[s.id] = true;
        });
        setExpandedSections(expands);
      }

      // 2. Get Student Enrollment (with preloaded LessonProgresses from our backend change)
      const enrollmentRes = await axiosClient.get('/api/v1/student/enrollments/my-courses');
      
      if (enrollmentRes.data && enrollmentRes.data.success) {
        const myEnrollments = enrollmentRes.data.data || [];
        const currentEnrollment = myEnrollments.find(e => e.course_id === Number(courseId));
        
        if (!currentEnrollment) {
          throw new Error('Bạn chưa đăng ký khóa học này. Vui lòng đăng ký trước khi vào học.');
        }
        
        setEnrollment(currentEnrollment);

        // Map lesson progress states for quick access
        const progressMap = {};
        if (currentEnrollment.lesson_progresses) {
          currentEnrollment.lesson_progresses.forEach(lp => {
            if (lp.is_completed) {
              progressMap[lp.lesson_id] = true;
            }
          });
        }
        setCompletedLessonsMap(progressMap);

        // Select first lesson in the curriculum as active by default
        if (courseData.sections && courseData.sections.length > 0) {
          const firstSection = courseData.sections[0];
          if (firstSection.lessons && firstSection.lessons.length > 0) {
            setActiveLesson(firstSection.lessons[0]);
          }
        }
      } else {
        throw new Error('Không thể lấy thông tin đăng ký học tập.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi hệ thống khi tải lớp học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchLearningData();
    }
  }, [courseId]);

  // Handle fullscreen orientation lock for mobile
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
      if (isFullscreen) {
        try {
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch (error) {
          console.warn('Orientation lock failed:', error);
        }
      } else {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (error) {
          console.warn('Orientation unlock failed:', error);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setActiveQuiz(null);
    setActiveAssignment(null);
    setIsPlaying(false);
    setVideoProgress(0);
    setActiveTab('overview');
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || isMarkingComplete) return;
    
    // Optimistic UI update or wait for API response
    setIsMarkingComplete(true);
    try {
      const response = await axiosClient.post(`/api/v1/student/progress/lessons/${activeLesson.id}/complete`);

      if (response.data && response.data.success) {
        const newProgress = response.data.data.progress_percentage;
        
        // Update local state
        setCompletedLessonsMap(prev => ({
          ...prev,
          [activeLesson.id]: true
        }));

        setEnrollment(prev => ({
          ...prev,
          progress_percentage: newProgress,
          completed_at: newProgress === 100 ? new Date().toISOString() : prev?.completed_at
        }));
      }
    } catch (err) {
      console.error('Failed to mark lesson complete', err);
      alert(err.response?.data?.message || 'Không thể đánh dấu hoàn thành bài học.');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleDownloadMaterials = (lesson) => {
    if (downloadingFile) return;
    setDownloadingFile(true);
    
    setTimeout(() => {
      setDownloadingFile(false);
      const docUrl = lesson.document_url || 'https://lms.edu.vn/materials/default_guide.pdf';
      
      // Attempt triggering a browser download trigger
      const link = document.createElement('a');
      link.href = docUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('download', `${lesson.title.replace(/\s+/g, '_')}_Document.pdf`);
      document.body.appendChild(link);
      
      // Actually click the link to trigger the download or open in new tab
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
    }, 1500);
  };

  // Helper to count total lessons in course
  const getTotalLessons = () => {
    if (!course || !course.sections) return 0;
    let count = 0;
    course.sections.forEach(s => {
      if (s.lessons) count += s.lessons.length;
    });
    return count;
  };

  // Helper to count completed lessons
  const getCompletedCount = () => {
    return Object.keys(completedLessonsMap).length;
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang chuẩn bị học liệu trực tuyến...</span>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="max-w-xl mx-auto py-16 space-y-4">
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold">Lỗi truy cập lớp học</h4>
            <p>{errorMsg || 'Bạn không có quyền học lớp này.'}</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang cá nhân</span>
        </button>
      </div>
    );
  }

  const totalLessons = getTotalLessons();
  const completedLessons = getCompletedCount();
  const progressPercentage = enrollment ? enrollment.progress_percentage : 0;

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col lg:flex-row border border-slate-900 rounded-3xl overflow-hidden bg-slate-900/10 backdrop-blur-md relative">
      
      {/* Sidebar toggle button for mobile */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-30 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* 1. Left Syllabus Navigation Sidebar */}
      <aside className={`w-full lg:w-80 bg-slate-950 border-r border-slate-900 flex flex-col justify-between transition-all duration-300 z-20 ${sidebarOpen ? 'block' : 'hidden lg:flex'}`}>
        
        <div>
          {/* Header Dashboard with Course Title & Progress Bar */}
          <div className="p-5 border-b border-slate-900 space-y-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-amber-500 uppercase tracking-widest transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang cá nhân</span>
            </button>

            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-200 line-clamp-2 leading-snug">{course.title}</h2>
              <span className="text-[10px] text-slate-500 block">Giáo trình khóa học</span>
            </div>

            {/* Premium Progress Bar Wrapper */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-semibold">Tiến trình học tập</span>
                <span className="font-bold text-amber-500 font-mono">{progressPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                <div 
                  style={{ width: `${progressPercentage}%` }} 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-lg shadow-amber-500/20 transition-all duration-500"
                ></div>
              </div>
              <span className="text-[9px] text-slate-500 block text-right font-mono">
                Đã hoàn thành {completedLessons}/{totalLessons} bài học
              </span>
            </div>
          </div>

          {/* List of sections & lessons */}
          <div className="divide-y divide-slate-900/60 max-h-[calc(100vh-380px)] overflow-y-auto">
            {course.sections?.map((section, idx) => {
              const isExpanded = !!expandedSections[section.id];
              return (
                <div key={section.id} className="bg-slate-950">
                  
                  {/* Section Head Trigger */}
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-900/10 transition"
                  >
                    <div className="min-w-0 pr-4">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500/60 block">Chương {idx + 1}</span>
                      <h4 className="text-[11px] font-bold text-slate-300 truncate leading-relaxed">{section.title}</h4>
                    </div>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {/* Section Lessons and Quizzes */}
                  {isExpanded && (
                    <div className="bg-slate-900/20 divide-y divide-slate-950/40">
                      {/* Lessons List */}
                      {section.lessons?.map((lesson, lessonIdx) => {
                        const isActive = activeLesson?.id === lesson.id;
                        const isCompleted = !!completedLessonsMap[lesson.id];
                        const isVideo = lesson.type === 'video';

                        return (
                          <div 
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson)}
                            className={`px-5 py-3 flex items-center justify-between cursor-pointer transition ${isActive ? 'bg-amber-500/5 text-amber-500 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {/* Icon type */}
                              <div className="flex-shrink-0">
                                {isVideo ? <Video className="w-3.5 h-3.5 text-slate-500" /> : <FileText className="w-3.5 h-3.5 text-sky-400" />}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold block truncate leading-snug">
                                  {idx + 1}.{lessonIdx + 1} {lesson.title}
                                </span>
                                {isVideo && lesson.duration && (
                                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                                    {Math.round(lesson.duration / 60)} phút
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Completed Status Checkmark */}
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-700 hover:text-amber-500/50" />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Quizzes List */}
                      {section.quizzes?.map((quiz) => {
                        const isActive = activeQuiz?.id === quiz.id;
                        return (
                          <div 
                            key={quiz.id}
                            onClick={() => {
                              setActiveQuiz(quiz);
                              setActiveLesson(null);
                              setActiveAssignment(null);
                            }}
                            className={`px-5 py-3 flex items-center justify-between cursor-pointer transition ${isActive ? 'bg-amber-500/5 text-amber-500 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="flex-shrink-0">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold block truncate leading-snug">
                                  Thi: {quiz.title}
                                </span>
                                <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                                  {quiz.duration} phút • Điểm đạt: {quiz.passing_score}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Assignments List */}
                      {section.assignments?.map((assignment) => {
                        const isActive = activeAssignment?.id === assignment.id;
                        return (
                          <div 
                            key={assignment.id}
                            onClick={() => {
                              setActiveAssignment(assignment);
                              setActiveLesson(null);
                              setActiveQuiz(null);
                            }}
                            className={`px-5 py-3 flex items-center justify-between cursor-pointer transition ${isActive ? 'bg-amber-500/5 text-amber-500 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="flex-shrink-0">
                                <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold block truncate leading-snug">
                                  Bài tập: {assignment.title}
                                </span>
                                <span className="text-[9px] text-slate-500 block font-mono mt-0.5">
                                  Hạn nộp: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('vi-VN') : '—'} • {assignment.max_score || 10}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* Certificate eligibility banner at bottom */}
        {progressPercentage === 100 && (
          <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 text-center space-y-2">
            <Award className="w-6 h-6 text-amber-500 mx-auto" />
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Đủ điều kiện nhận chứng chỉ</p>
            <button 
              onClick={async () => {
                try {
                  const res = await axios.post(`/api/v1/student/enrollments/${courseId}/certificate`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.data) {
                    alert('Yêu cầu cấp chứng chỉ của bạn đã được tiếp nhận và xử lý thành công! Vui lòng tải tài liệu chứng chỉ từ mục "Chứng chỉ tốt nghiệp".');
                  }
                } catch (err) {
                  alert(err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu cấp chứng chỉ.');
                }
              }}
              className="py-1.5 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-lg text-[9px] w-full transition"
            >
              Nhận chứng chỉ PDF
            </button>
          </div>
        )}

      </aside>

      {/* 2. Right Content Player Panel */}
      <main className="flex-1 bg-[#07090f] p-6 lg:p-8 flex flex-col justify-between overflow-y-auto">
        
        {activeQuiz ? (
          <div className="flex-1 flex flex-col">
            <QuizPlayer 
              quizId={activeQuiz.id} 
              token={token} 
              onBack={() => {
                setActiveQuiz(null);
                if (course.sections && course.sections.length > 0) {
                  const firstSec = course.sections[0];
                  if (firstSec.lessons && firstSec.lessons.length > 0) {
                    setActiveLesson(firstSec.lessons[0]);
                  }
                }
              }} 
            />
          </div>
        ) : activeAssignment ? (
          <div className="flex-1 flex flex-col">
            <StudentAssignment
              assignment={activeAssignment}
              token={token}
              onBack={() => {
                setActiveAssignment(null);
                if (course.sections && course.sections.length > 0) {
                  const firstSec = course.sections[0];
                  if (firstSec.lessons && firstSec.lessons.length > 0) {
                    setActiveLesson(firstSec.lessons[0]);
                  }
                }
              }}
            />
          </div>
        ) : activeLesson ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Bài học đang phát</span>
                  <h1 className="text-base font-bold text-slate-100 mt-1">{activeLesson.title}</h1>
                </div>
                
                {/* Completion indicator */}
                {completedLessonsMap[activeLesson.id] ? (
                  <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bài học đã hoàn thành</span>
                  </span>
                ) : (
                  <button 
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete}
                    className="py-1.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isMarkingComplete ? (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-950" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    )}
                    <span>Đánh dấu hoàn thành bài</span>
                  </button>
                )}
              </div>

              {/* CORE VIEWER AREA */}
              <div className="space-y-6">
                {activeLesson.type === 'video' ? (
                  /* Video Player Viewer Container */
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 group shadow-2xl">
                    {activeLesson.video_url ? (() => {
                      let cleanUrl = activeLesson.video_url.trim();
                      
                      // Override dead dummy cloudinary video from DB seeding with a working dummy video
                      if (cleanUrl.includes('res.cloudinary.com/')) {
                        cleanUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Never Gonna Give You Up - universally supported by ReactPlayer
                        activeLesson.video_url = cleanUrl;
                      }

                      if (cleanUrl.startsWith('/')) {
                        const baseUrl = import.meta.env.VITE_API_URL || '';
                        cleanUrl = `${baseUrl}${cleanUrl}`;
                      }

                      if (cleanUrl.includes('<iframe')) {
                        const match = cleanUrl.match(/src=["'](.*?)["']/);
                        if (match && match[1]) {
                          cleanUrl = match[1].trim();
                        }
                      }

                      let isYouTube = false;
                      let ytId = null;
                      if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
                        isYouTube = true;
                        const ytMatch = cleanUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
                        if (ytMatch && ytMatch[1]) {
                          ytId = ytMatch[1];
                        }
                      }

                      if (isYouTube && ytId) {
                        return (
                          <div className="absolute inset-0 w-full h-full">
                            <YouTube 
                              videoId={ytId}
                              className="w-full h-full absolute inset-0"
                              iframeClassName="w-full h-full"
                              opts={{
                                width: '100%',
                                height: '100%',
                                playerVars: {
                                  autoplay: 1,
                                  rel: 0,
                                  modestbranding: 1,
                                }
                              }}
                              onReady={(e) => {
                                videoRef.current = e.target;
                                if (!window.ytIntervals) window.ytIntervals = {};
                                if (window.ytIntervals[activeLesson.id]) clearInterval(window.ytIntervals[activeLesson.id]);
                                
                                window.ytIntervals[activeLesson.id] = setInterval(() => {
                                  if (videoRef.current && videoRef.current.getCurrentTime) {
                                    const currentTime = videoRef.current.getCurrentTime();
                                    const duration = videoRef.current.getDuration();
                                    setCurrentVideoSeconds(currentTime);
                                    if (duration > 0) {
                                      const progress = (currentTime / duration) * 100;
                                      setVideoProgress(progress);
                                      if (progress >= 95) handleMarkComplete();
                                    }
                                  }
                                }, 1000);
                              }}
                              onPlay={() => setIsPlaying(true)}
                              onPause={() => setIsPlaying(false)}
                            />
                          </div>
                        );
                      }

                      // Fallback for Google Drive or custom iframes
                      if (cleanUrl.includes('drive.google.com') || activeLesson.video_url.includes('<iframe')) {
                        return (
                          <div className="absolute inset-0 w-full h-full relative">
                            <iframe 
                              src={cleanUrl} 
                              className="w-full h-full absolute inset-0 border-0" 
                              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                              allowFullScreen
                            />
                            {/* Overlay button to mark complete since we can't track iframe progress */}
                            <div className="absolute bottom-4 right-4 z-10">
                               <button onClick={handleMarkComplete} disabled={isMarkingComplete} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-full shadow-lg transition">Đã xem xong</button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="absolute inset-0 w-full h-full">
                          <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-[10px] p-2 z-50 font-mono break-all border-b border-red-400 shadow-lg pointer-events-none">
                             <strong className="text-white uppercase tracking-wider">DEBUG URL:</strong> {cleanUrl} 
                             <span className="ml-2 text-white/70">(Chụp lại nếu video lỗi)</span>
                          </div>
                          <ReactPlayer
                            ref={videoRef}
                            url={cleanUrl}
                            width="100%"
                            height="100%"
                            controls={true}
                            playing={isPlaying}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onProgress={(state) => {
                              setCurrentVideoSeconds(state.playedSeconds);
                              setVideoProgress(state.played * 100);
                              if (state.played >= 0.95) handleMarkComplete();
                            }}
                          />
                        </div>
                      );
                    })() : (
                      /* Mock Video Player Display */
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-6 text-center space-y-4">
                        <Video className="w-16 h-16 text-slate-800 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-300">Nội dung bài học dạng Video</p>
                          <p className="text-[10px] text-slate-500 max-w-sm">Trình mô phỏng phát video học trực tuyến dành cho môi trường phát triển.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Document Viewer Panel */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Main content read area */}
                    <div className="md:col-span-2 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-300 border-b border-slate-900 pb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sky-400" />
                          <span>Nội dung bài viết giáo trình</span>
                        </h3>
                        <p className="text-xs text-slate-450 leading-relaxed whitespace-pre-line">
                          {activeLesson.content || 'Bài giảng này không chứa giáo trình tự luận trực tuyến. Bạn vui lòng tải tài liệu học đính kèm bên phải để tự ôn luyện.'}
                        </p>
                      </div>
                      
                      <div className="text-[10px] text-slate-550 border-t border-slate-900/50 pt-4 mt-6">
                        Lưu ý: Sau khi hoàn thành việc đọc và nắm bắt kiến thức bài học, bạn hãy bấm "Đánh dấu hoàn thành bài" để ghi lại lịch sử học tập.
                      </div>
                    </div>

                    {/* Sidebar Download card */}
                    <div className="bg-[#0b0e17] border border-slate-850 rounded-2xl p-6 flex flex-col justify-between h-fit relative overflow-hidden">
                      <div className="space-y-4 text-center">
                        <FileText className="w-12 h-12 text-sky-400/80 mx-auto" />
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-200 leading-snug truncate" title={activeLesson.title}>
                            {activeLesson.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 block font-mono">Định dạng tài liệu: PDF</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button 
                          onClick={() => handleDownloadMaterials(activeLesson)}
                          disabled={downloadingFile}
                          className="w-full py-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {downloadingFile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              <span>Đang tải xuống...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 text-slate-950" />
                              <span>Tải tài liệu đính kèm</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Content Tabs */}
            <div className="mt-8">
              <div className="flex items-center gap-6 border-b border-slate-800/60 pb-2">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 px-1 text-xs font-bold transition border-b-2 ${activeTab === 'overview' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Tổng quan
                </button>
                <button 
                  onClick={() => setActiveTab('qna')}
                  className={`pb-2 px-1 text-xs font-bold transition border-b-2 ${activeTab === 'qna' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Hỏi đáp (Q&A)
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2 px-1 text-xs font-bold transition border-b-2 ${activeTab === 'notes' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Ghi chú cá nhân
                </button>
                <button 
                  onClick={() => setActiveTab('attachments')}
                  className={`pb-2 px-1 text-xs font-bold transition border-b-2 ${activeTab === 'attachments' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Tài liệu đính kèm
                </button>
              </div>

              <div className="pt-6">
                {activeTab === 'overview' && (
                  <div className="bg-slate-900/10 border border-slate-900/50 rounded-xl md:rounded-2xl p-3 md:p-4 text-[9px] md:text-[10px] text-slate-500 flex items-center gap-2 md:gap-3">
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-500/50 flex-shrink-0" />
                    <p>Khóa học tích hợp hỗ trợ giải đáp từ xa. Bạn có thể để lại thắc mắc ở tab Hỏi đáp và giảng viên sẽ phản hồi trực tiếp cho bạn qua kênh thông báo hệ thống.</p>
                  </div>
                )}
                {activeTab === 'qna' && (
                  <LessonDiscussion lessonId={activeLesson.id} token={token} />
                )}
                {activeTab === 'notes' && (
                  <LessonNotes 
                    lessonId={activeLesson.id} 
                    token={token} 
                    currentVideoTime={currentVideoSeconds}
                    onSeek={(seconds) => {
                      if (videoRef.current) {
                        if (typeof videoRef.current.seekTo === 'function') {
                          if (videoRef.current.getInternalPlayer) {
                            videoRef.current.seekTo(seconds, 'seconds');
                          } else {
                            videoRef.current.seekTo(seconds, true);
                          }
                        } else {
                          videoRef.current.currentTime = seconds;
                        }
                      }
                    }}
                  />
                )}
                {activeTab === 'attachments' && (
                  <LessonAttachments lessonId={activeLesson.id} token={token} />
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Empty Active Lesson state */
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 space-y-4 py-20 min-h-[40vh]">
            <BookOpen className="w-16 h-16 text-slate-800" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-300">Chương trình học tập trống</h3>
              <p className="text-xs max-w-xs mx-auto">Vui lòng chọn bài giảng từ Sidebar bên trái để bắt đầu bài học của bạn.</p>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
