import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../cart/cartSlice';
import { 
  fetchCourseReviews, 
  submitReview, 
  editReview, 
  replyToReview, 
  moderateReview 
} from '../review/reviewSlice';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Award, 
  Play, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Video,
  ShoppingBag,
  Star,
  Edit2,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

export default function CourseDetail({ courseId: propCourseId, onBack, token: propToken }) {
  // Allow picking ID from props or URL query/params if react-router is used
  const courseId = propCourseId;
  
  const dispatch = useDispatch();
  const { token: authToken, role: authRole, userId: authUserId } = useSelector(state => state.auth);
  const token = propToken || authToken || localStorage.getItem('lms_token') || '';
  const role = authRole || localStorage.getItem('lms_role') || 'student';
  const userId = authUserId || localStorage.getItem('lms_user_id') || '';
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Reviews state
  const { reviews, stats, isLoading: isReviewsLoading } = useSelector(state => state.review);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [editingReplyId, setEditingReplyId] = useState(null);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseReviews(courseId));
    }
  }, [courseId, dispatch]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Vui lòng đăng nhập để đánh giá khóa học!');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      alert('Vui lòng chọn số sao từ 1 đến 5!');
      return;
    }
    if (!reviewComment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    try {
      if (isEditingReview) {
        await dispatch(editReview({ token, courseId, rating: reviewRating, comment: reviewComment })).unwrap();
        alert('Cập nhật đánh giá thành công!');
      } else {
        await dispatch(submitReview({ token, courseId, rating: reviewRating, comment: reviewComment })).unwrap();
        alert('Gửi đánh giá thành công!');
      }
      setShowReviewForm(false);
      setIsEditingReview(false);
      setReviewComment('');
    } catch (err) {
      alert(err || 'Đã xảy ra lỗi khi gửi đánh giá.');
    }
  };

  const handleReviewEditClick = (myReview) => {
    setReviewRating(myReview.rating);
    setReviewComment(myReview.comment);
    setIsEditingReview(true);
    setShowReviewForm(true);
  };

  const handleTeacherReplySubmit = async (e, reviewId) => {
    e.preventDefault();
    const replyText = replyTextMap[reviewId];
    if (!replyText || !replyText.trim()) {
      alert('Vui lòng nhập nội dung phản hồi!');
      return;
    }

    try {
      await dispatch(replyToReview({ token, reviewId, courseId, reply: replyText })).unwrap();
      alert('Gửi phản hồi thành công!');
      setEditingReplyId(null);
      setReplyTextMap(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      alert(err || 'Đã xảy ra lỗi khi gửi phản hồi.');
    }
  };

  const handleModerateReviewClick = async (reviewId, isHidden) => {
    const actionText = isHidden ? 'ẩn' : 'hiển thị';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} đánh giá này?`)) {
      return;
    }
    try {
      await dispatch(moderateReview({ token, reviewId, courseId, isHidden })).unwrap();
      alert(`Đã ${actionText} đánh giá thành công!`);
    } catch (err) {
      alert(err || 'Đã xảy ra lỗi khi kiểm duyệt đánh giá.');
    }
  };

  const renderStars = (rating, sizeClass = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`${sizeClass} ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} 
          />
        ))}
      </div>
    );
  };

  const fetchCourseDetails = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`/api/v1/courses/${courseId}`);
      if (response.data && response.data.success) {
        setCourse(response.data.data);
        
        // Expand first section by default if present
        if (response.data.data.sections && response.data.data.sections.length > 0) {
          setExpandedSections({ [response.data.data.sections[0].id]: true });
        }
      } else {
        throw new Error('Không thể tải thông tin khóa học');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Không thể kết nối đến máy chủ hoặc khóa học không tồn tại.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!token) return;
    setIsCheckingEnrollment(true);
    try {
      const response = await axios.get('/api/v1/student/enrollments/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        const myCourses = response.data.data || [];
        const found = myCourses.some(enrollment => enrollment.course_id === Number(courseId));
        setIsEnrolled(found);
      }
    } catch (err) {
      console.error('Failed to verify enrollment status', err);
    } finally {
      setIsCheckingEnrollment(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
      checkEnrollmentStatus();
    }
  }, [courseId]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleEnrollOrCheckout = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để đăng ký khóa học!');
      return;
    }

    setIsProcessingCheckout(true);
    try {
      if (course.price === 0) {
        // Free Course: Direct Enrollment
        const response = await axios.post(`/api/v1/student/enrollments/enroll/${courseId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.success) {
          setIsEnrolled(true);
          alert('Đăng ký khóa học thành công! Bạn đã có thể bắt đầu học ngay bây giờ.');
        }
      } else {
        // Paid Course: VNPay Payment Integration
        const response = await axios.post('/api/v1/student/payments/checkout', {
          course_ids: [Number(courseId)]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.success && response.data.payment_url) {
          // Redirect to VNPay Payment Page
          window.location.href = response.data.payment_url;
        } else {
          throw new Error(response.data.message || 'Không tạo được liên kết thanh toán');
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý đăng ký học.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để thêm khóa học vào giỏ hàng!');
      return;
    }
    setIsAddingToCart(true);
    try {
      await dispatch(addToCart({ token, courseId: Number(courseId) })).unwrap();
      alert('Đã thêm khóa học vào giỏ hàng thành công!');
    } catch (err) {
      alert(err || 'Không thể thêm khóa học vào giỏ hàng.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Helper to compute total course duration
  const getTotalDuration = () => {
    if (!course || !course.sections) return 0;
    let totalSeconds = 0;
    course.sections.forEach(s => {
      if (s.lessons) {
        s.lessons.forEach(l => {
          totalSeconds += l.duration || 0;
        });
      }
    });
    return Math.round(totalSeconds / 60); // return in minutes
  };

  // Helper to compute total lesson count
  const getLessonCount = () => {
    if (!course || !course.sections) return 0;
    let count = 0;
    course.sections.forEach(s => {
      if (s.lessons) count += s.lessons.length;
    });
    return count;
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang đồng bộ dữ liệu đề cương bài học...</span>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-10">
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold">Đã xảy ra lỗi</p>
            <p>{errorMsg || 'Khóa học không khả dụng.'}</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục</span>
        </button>
      </div>
    );
  }

  const lessonsCount = getLessonCount();
  const totalDurationMin = getTotalDuration();

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Top Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-500 transition w-fit group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Quay lại danh sách khóa học</span>
      </button>

      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-md p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Decorative ambient background */}
        <div className="absolute inset-0 -z-10 bg-slate-950">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover opacity-20 blur-sm" />
          ) : (
            <>
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl"></div>
              <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"></div>
            </>
          )}
        </div>

        {/* Content details */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-center">
          
          {course.category && (
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit">
              {course.category.name}
            </span>
          )}

          <h1 className="font-serif text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            {course.subtitle || 'Khóa học cung cấp đầy đủ lý thuyết và bài tập thực hành chất lượng cao.'}
          </p>

          {/* Metadata strips */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500/70" />
              <span>Giảng viên: <strong className="text-slate-300 font-semibold">{course.teacher?.name || 'Đội ngũ LMS'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500/70" />
              <span>{lessonsCount} bài học</span>
            </div>
            {totalDurationMin > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500/70" />
                <span>Tổng thời lượng: ~{totalDurationMin} phút</span>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Card */}
        <div className="bg-[#0b0e17] border border-slate-850 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden h-fit lg:self-center">
          
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-slate-900">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block mb-1">Học phí trọn gói</span>
              <div className="flex items-center justify-center gap-1">
                {course.price === 0 ? (
                  <span className="text-2xl font-black text-emerald-500 uppercase tracking-wide">Miễn phí</span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-amber-500 font-mono">
                      {course.price?.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-bold text-slate-400">đ</span>
                  </>
                )}
              </div>
            </div>

            <ul className="text-xs text-slate-400 space-y-2.5 py-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Quyền truy cập học tập trọn đời</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Nhận chứng chỉ sau khi hoàn tất</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Hỗ trợ hỏi đáp 24/7 từ giáo viên</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            {isCheckingEnrollment ? (
              <button 
                disabled 
                className="w-full py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-500 flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra quyền học...</span>
              </button>
            ) : isEnrolled ? (
              <div className="space-y-2">
                <span className="block text-center text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-lg">
                  ✓ Bạn đã đăng ký khóa học này
                </span>
                <button 
                  onClick={() => alert('Vui lòng truy cập "Học tập của tôi" từ Sidebar để xem chi tiết bài học và làm bài tập!')}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs transition duration-200"
                >
                  Bắt đầu học ngay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={handleEnrollOrCheckout}
                  disabled={isProcessingCheckout}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2"
                >
                  {isProcessingCheckout ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Đang xử lý giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>{course.price === 0 ? 'Đăng ký học miễn phí' : 'Mua ngay qua VNPay'}</span>
                    </>
                  )}
                </button>

                {course.price > 0 && (
                  <button 
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang thêm vào giỏ...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        <span>Thêm vào giỏ hàng</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Main Grid: Description & Syllabus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: About & Syllabus */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Section */}
          <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Giới thiệu khóa học</span>
            </h2>
            <div className="text-slate-350 text-xs leading-relaxed whitespace-pre-line">
              {course.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
            </div>
          </div>

          {/* Curriculum / Syllabus Outline Accordion */}
          <div className="space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h2 className="font-serif text-lg font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Giáo trình đào tạo</span>
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                {course.sections?.length || 0} chương • {lessonsCount} bài
              </span>
            </div>

            {(!course.sections || course.sections.length === 0) ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-900 rounded-2xl">
                Đề cương môn học đang được giảng viên xây dựng và cập nhật.
              </div>
            ) : (
              <div className="space-y-3">
                {course.sections.map((section, idx) => {
                  const isExpanded = !!expandedSections[section.id];
                  const lessons = section.lessons || [];

                  return (
                    <div 
                      key={section.id} 
                      className="border border-slate-900/60 rounded-xl overflow-hidden bg-slate-950/20"
                    >
                      {/* Section Accordion Trigger */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/20 transition bg-slate-900/10"
                      >
                        <div className="space-y-1 pr-4">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500/70">
                            Chương {idx + 1}
                          </span>
                          <h3 className="text-xs font-bold text-slate-200">
                            {section.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>{lessons.length} bài</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Section Lessons List */}
                      {isExpanded && (
                        <div className="border-t border-slate-900/50 bg-[#070b12]/30 divide-y divide-slate-900/30">
                          {lessons.length === 0 ? (
                            <div className="p-4 text-center text-[11px] text-slate-500">Chưa có bài học nào trong chương này.</div>
                          ) : (
                            lessons.map((lesson, lessonIdx) => {
                              const isVideo = lesson.type === 'video';
                              const formattedDuration = lesson.duration 
                                ? `${Math.round(lesson.duration / 60)} phút` 
                                : '';

                              return (
                                <div 
                                  key={lesson.id}
                                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-950/40 transition group"
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800 flex-shrink-0 group-hover:text-amber-500 transition">
                                      {isVideo ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-slate-300 truncate leading-snug">
                                        {idx + 1}.{lessonIdx + 1} {lesson.title}
                                      </p>
                                      {formattedDuration && (
                                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{formattedDuration}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Locked states for non-enrolled students */}
                                  {!isEnrolled ? (
                                    <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                                      <Lock className="w-3 h-3 text-slate-500" />
                                      <span className="hidden sm:inline font-semibold">Khóa</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Play className="w-3 h-3 fill-amber-500" />
                                      <span>Xem bài học</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Đánh giá và Phản hồi khóa học */}
          <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h2 className="font-serif text-lg font-bold text-slate-200 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Đánh giá khóa học</span>
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                {stats.total_reviews || 0} đánh giá
              </span>
            </div>

            {/* Thống kê sao */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#0b0e17]/50 border border-slate-850 p-6 rounded-2xl">
              <div className="text-center md:border-r border-slate-850 space-y-2">
                <span className="text-4xl font-black text-slate-100 font-mono">
                  {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
                </span>
                <div className="flex justify-center">
                  {renderStars(Math.round(stats.average_rating || 0), "w-5 h-5")}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Xếp hạng trung bình của khóa học
                </span>
              </div>

              <div className="md:col-span-2 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const percent = stats.percentages?.[star] || stats.percentages?.[String(star)] || 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-3 text-right text-slate-400 font-mono">{star}</span>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-500 font-mono">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quản lý đánh giá cá nhân của Học viên */}
            {(() => {
              const myReview = reviews.find(r => String(r.student_id) === String(userId));
              return (
                <div className="space-y-4">
                  {myReview ? (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Đánh giá của bạn</span>
                          {renderStars(myReview.rating)}
                        </div>
                        <button
                          onClick={() => handleReviewEditClick(myReview)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 hover:text-amber-400 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-350 italic">"{myReview.comment}"</p>
                    </div>
                  ) : (
                    isEnrolled && role === 'student' && !showReviewForm && (
                      <button
                        onClick={() => {
                          setReviewRating(5);
                          setReviewComment('');
                          setIsEditingReview(false);
                          setShowReviewForm(true);
                        }}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition duration-200"
                      >
                        Viết đánh giá
                      </button>
                    )
                  )}

                  {showReviewForm && (
                    <form onSubmit={handleReviewSubmit} className="bg-[#0b0e17]/60 border border-slate-850 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-200">
                          {isEditingReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá mới'}
                        </h4>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowReviewForm(false);
                            setIsEditingReview(false);
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">Chọn xếp hạng</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 hover:scale-110 transition duration-150"
                            >
                              <Star 
                                className={`w-6 h-6 ${((hoverRating || reviewRating) >= star) ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block">Nội dung đánh giá</label>
                        <textarea
                          rows="3"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Chia sẻ cảm nghĩ của bạn về giảng viên và khóa học này..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs transition duration-200"
                      >
                        {isEditingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                      </button>
                    </form>
                  )}
                </div>
              );
            })()}

            {/* Danh sách đánh giá công khai */}
            {isReviewsLoading ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 text-amber-550 animate-spin mx-auto" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-900 rounded-2xl">
                Chưa có đánh giá nào cho khóa học này. Hãy là người đầu tiên đánh giá!
              </div>
            ) : (
              <div className="space-y-6 divide-y divide-slate-900/60">
                {reviews.map((review, idx) => {
                  const studentName = review.student?.name || 'Học viên LMS';
                  const initials = studentName[0] || 'H';
                  
                  return (
                    <div key={review.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-bold text-sm shadow-md">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-250">{studentName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {renderStars(review.rating, "w-3 h-3")}
                              <span className="text-[9px] text-slate-550 font-mono">
                                {new Date(review.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Controls */}
                        {role === 'admin' && (
                          <button
                            onClick={() => handleModerateReviewClick(review.id, !review.is_hidden)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                              review.is_hidden 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            }`}
                          >
                            {review.is_hidden ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Hiện</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Ẩn</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-350 leading-relaxed font-normal pl-12">
                        {review.comment}
                      </p>

                      {/* Phản hồi của giảng viên */}
                      {review.reply ? (
                        <div className="bg-[#0b0e17]/80 border border-slate-850 rounded-xl p-4 space-y-2 ml-12 relative overflow-hidden">
                          <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-amber-500/5 blur-xl"></div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                                Phản hồi từ Giảng viên
                              </span>
                            </div>

                            {/* Nút sửa phản hồi dành cho giảng viên */}
                            {role === 'teacher' && course.teacher?.id === Number(userId) && (
                              <button
                                onClick={() => {
                                  setEditingReplyId(review.id);
                                  setReplyTextMap(prev => ({ ...prev, [review.id]: review.reply }));
                                }}
                                className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-amber-500 transition"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>
                            )}
                          </div>
                          
                          {editingReplyId === review.id ? (
                            <form onSubmit={(e) => handleTeacherReplySubmit(e, review.id)} className="space-y-2 mt-2">
                              <textarea
                                rows="2"
                                value={replyTextMap[review.id] || ''}
                                onChange={(e) => setReplyTextMap(prev => ({ ...prev, [review.id]: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                                placeholder="Nhập nội dung phản hồi của bạn..."
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition duration-200"
                                >
                                  Cập nhật
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingReplyId(null)}
                                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-lg text-[10px] transition"
                                >
                                  Hủy
                                </button>
                              </div>
                            </form>
                          ) : (
                            <p className="text-xs text-slate-350 leading-relaxed font-normal">
                              {review.reply}
                            </p>
                          )}
                        </div>
                      ) : (
                        // Nút thêm phản hồi dành cho giảng viên
                        role === 'teacher' && course.teacher?.id === Number(userId) && (
                          <div className="ml-12">
                            {editingReplyId === review.id ? (
                              <form onSubmit={(e) => handleTeacherReplySubmit(e, review.id)} className="bg-[#0b0e17]/80 border border-slate-850 rounded-xl p-4 space-y-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                  Trả lời đánh giá
                                </span>
                                <textarea
                                  rows="2"
                                  value={replyTextMap[review.id] || ''}
                                  onChange={(e) => setReplyTextMap(prev => ({ ...prev, [review.id]: e.target.value }))}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                                  placeholder="Nhập nội dung phản hồi của bạn..."
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] transition duration-200"
                                  >
                                    Phản hồi
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingReplyId(null)}
                                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-lg text-[10px] transition"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setEditingReplyId(review.id)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 hover:text-amber-400 transition"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Trả lời đánh giá này</span>
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Instructor details & support info */}
        <div className="space-y-6">
          
          {/* Instructor Card */}
          <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2">
              Giảng viên phụ trách
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-serif text-lg font-black shadow-lg shadow-amber-900/20">
                {(course.teacher?.name || 'L')[0]}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  {course.teacher?.name || 'Giảng viên LMS'}
                </h4>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {course.teacher?.email || 'instructor@lms.edu.vn'}
                </span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Giảng viên có nhiều năm kinh nghiệm thực chiến trong các dự án lớn, luôn đồng hành hỗ trợ học viên giải đáp mọi thắc mắc trong suốt quá trình học tập.
            </p>
          </div>

          {/* Secure Purchase Note */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 text-center text-[10px] text-slate-500 space-y-2">
            <Award className="w-6 h-6 text-amber-500/50 mx-auto" />
            <p className="font-semibold text-slate-400">Học tập hiệu quả & An toàn</p>
            <p>Hệ thống hỗ trợ thanh toán bảo mật tuyệt đối qua cổng giao dịch ngân hàng VNPay. Quyền lợi học tập và nhận văn bằng của bạn được cam kết đảm bảo.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
