import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Loader2, 
  AlertCircle,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  Clock,
  Layers,
  FileCode,
  CheckSquare,
  Upload,
  MessageSquare
} from 'lucide-react';
import LessonDiscussion from '../learning/LessonDiscussion';

export default function CourseBuilder() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [studentProgress, setStudentProgress] = useState([]);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Form Fields: Quiz
  const [quizTitle, setQuizTitle] = useState('');
  const [quizPassingScore, setQuizPassingScore] = useState(80);
  const [quizMaxAttempts, setQuizMaxAttempts] = useState(3);
  const [quizDuration, setQuizDuration] = useState(15);

  // Form Fields: Assignment
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState(10);
  const [assignmentDueDate, setAssignmentDueDate] = useState('');

  // Form Fields: Question
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('single');
  const [answersInput, setAnswersInput] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [activeQuizForQuestions, setActiveQuizForQuestions] = useState(null);

  // Selection states
  const [activeCourse, setActiveCourse] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'course', 'section', 'lesson', 'quiz', 'assignment', 'attachment', 'qna'
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
  const [editItem, setEditItem] = useState(null);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [targetLessonId, setTargetLessonId] = useState(null);
  
  // Form Fields: Attachment
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentSize, setAttachmentSize] = useState(0);

  // Form Fields: Course
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubtitle, setCourseSubtitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseCategory, setCourseCategory] = useState('');
  const [courseThumbnailUrl, setCourseThumbnailUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form Fields: Section
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionOrder, setSectionOrder] = useState(1);

  // Form Fields: Lesson
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState('video'); // video, document
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDocUrl, setLessonDocUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState(0);
  const [lessonOrder, setLessonOrder] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadSource, setUploadSource] = useState('link'); // 'link', 'file'
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const token = localStorage.getItem('lms_token');

  const fetchStudentProgress = async (courseId) => {
    setIsLoadingProgress(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/v1/teacher/courses/${courseId}/progress`, { headers });
      setStudentProgress(response.data?.data || []);
      setIsProgressModalOpen(true);
    } catch (err) {
      alert('Không thể tải tiến độ học viên của khóa học này.');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const openQuizModal = (mode, sectionId) => {
    setTargetSectionId(sectionId);
    setQuizTitle('');
    setQuizPassingScore(80);
    setQuizMaxAttempts(3);
    setQuizDuration(15);
    setFormError('');
    setActiveModal('quiz');
  };

  const openAssignmentModal = (mode, sectionId) => {
    setTargetSectionId(sectionId);
    setAssignmentTitle('');
    setAssignmentDescription('');
    setAssignmentMaxScore(10);
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    const tzoffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(tomorrow.getTime() - tzoffset)).toISOString().slice(0, 16);
    setAssignmentDueDate(localISOTime);
    setFormError('');
    setActiveModal('assignment');
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) return setFormError('Tiêu đề không được để trống');
    if (!assignmentDescription.trim()) return setFormError('Mô tả không được để trống');
    if (!assignmentDueDate) return setFormError('Hạn nộp không được để trống');
    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const formattedDueDate = new Date(assignmentDueDate).toISOString();
      const body = {
        title: assignmentTitle,
        description: assignmentDescription,
        max_score: Number(assignmentMaxScore),
        due_date: formattedDueDate
      };

      await axios.post(`/api/v1/teacher/sections/${targetSectionId}/assignments`, body, { headers });

      setSuccessMsg('Đã thêm bài tập mới!');
      setActiveModal(null);
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.message || 'Lỗi khi lưu bài tập.');
    } finally {
      setIsSaving(false);
    }
  };

  const openQuestionFormModal = (quiz) => {
    setActiveQuizForQuestions(quiz);
    setQuestionText('');
    setQuestionType('single');
    setAnswersInput([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]);
    setFormError('');
    setActiveModal('question');
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim()) return setFormError('Tiêu đề không được để trống');
    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        title: quizTitle,
        passing_score: Number(quizPassingScore),
        max_attempts: Number(quizMaxAttempts),
        duration: Number(quizDuration)
      };

      await axios.post(`/api/v1/teacher/sections/${targetSectionId}/quizzes`, body, { headers });

      setSuccessMsg('Đã thêm bài trắc nghiệm mới!');
      setActiveModal(null);
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Lỗi khi lưu bài trắc nghiệm.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return setFormError('Nội dung câu hỏi không được để trống');
    
    const hasCorrect = answersInput.some(a => a.isCorrect);
    if (!hasCorrect) return setFormError('Vui lòng chọn ít nhất một đáp án đúng');

    const allFilled = answersInput.every(a => a.text.trim() !== '');
    if (!allFilled) return setFormError('Vui lòng nhập đầy đủ nội dung cho các đáp án');

    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        questions: [
          {
            question_text: questionText,
            type: questionType,
            answers: answersInput.map(a => ({
              answer_text: a.text,
              is_correct: a.isCorrect
            }))
          }
        ]
      };

      await axios.post(`/api/v1/teacher/quizzes/${activeQuizForQuestions.id}/questions`, body, { headers });

      setSuccessMsg('Đã thêm câu hỏi thành công!');
      setActiveModal(null);
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Lỗi khi lưu câu hỏi.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const catRes = await axios.get('/api/v1/categories');
      const catData = catRes.data?.data || catRes.data || [];
      setCategories(Array.isArray(catData) ? catData : []);
      
      const courseRes = await axios.get('/api/v1/teacher/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const courseData = courseRes.data?.data || courseRes.data || [];
      
      // Filter only courses owned by this teacher (using teacher_id matching local user id if available)
      const currentUserId = Number(localStorage.getItem('lms_user_id'));
      const teacherCourses = (Array.isArray(courseData) ? courseData : []).filter(c => c.teacher_id === currentUserId);
      setCourses(teacherCourses);
      
      if (teacherCourses.length > 0) {
        // Fetch full course details including sections/lessons for the first course
        fetchCourseDetails(teacherCourses[0].id);
      }
    } catch (err) {
      setApiError('Không thể đồng bộ cơ sở dữ liệu học liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseDetails = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/v1/teacher/courses/${id}/details`, { headers });
      const courseData = response.data?.data || response.data;
      setActiveCourse(courseData);
    } catch (err) {
      setApiError('Lỗi khi tải chi tiết đề cương khóa học.');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- COURSE CRUD ---
  const openCourseModal = (mode, course = null) => {
    setModalMode(mode);
    setEditItem(course);
    setFormError('');
    if (mode === 'create') {
      setCourseTitle('');
      setCourseSubtitle('');
      setCourseDescription('');
      setCoursePrice(0);
      setCourseCategory(categories[0]?.id || '');
      setCourseThumbnailUrl('');
    } else {
      setCourseTitle(course.title);
      setCourseSubtitle(course.subtitle || '');
      setCourseDescription(course.description || '');
      setCoursePrice(course.price);
      setCourseCategory(course.category_id);
      setCourseThumbnailUrl(course.thumbnail_url || '');
    }
    setActiveModal('course');
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim()) return setFormError('Tiêu đề không được để trống');
    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        title: courseTitle,
        subtitle: courseSubtitle,
        description: courseDescription,
        price: Number(coursePrice),
        category_id: Number(courseCategory),
        thumbnail_url: courseThumbnailUrl,
      };

      let res;
      if (modalMode === 'create') {
        res = await axios.post('/api/v1/teacher/courses', body, { headers });
      } else {
        res = await axios.put(`/api/v1/teacher/courses/${editItem.id}`, body, { headers });
      }

      setSuccessMsg(modalMode === 'create' ? 'Đã tạo khóa học thành công!' : 'Đã lưu thay đổi khóa học!');
      setActiveModal(null);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Lỗi khi lưu thông tin khóa học.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingImage(true);
    setFormError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      const res = await axios.post('/api/v1/teacher/courses/upload-image', formData, { headers });
      if (res.data && res.data.success && res.data.image_url) {
        setCourseThumbnailUrl(res.data.image_url);
        setSuccessMsg('Tải ảnh bìa lên thành công!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setFormError('Không nhận được liên kết ảnh từ máy chủ.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi tải ảnh.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCourseDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Hành động này sẽ xóa toàn bộ chương học và bài giảng liên quan.')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/v1/teacher/courses/${id}`, { headers });
      setSuccessMsg('Đã xóa khóa học thành công!');
      setActiveCourse(null);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Lỗi khi xóa khóa học.');
    }
  };

  const handleUpdateCourseStatus = async (courseId, status) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`/api/v1/teacher/courses/${courseId}/status`, { status }, { headers });
      setSuccessMsg(status === 'pending' ? 'Đã gửi yêu cầu phê duyệt khóa học!' : 'Đã hủy gửi duyệt. Khóa học về trạng thái nháp.');
      fetchCourseDetails(courseId);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái khóa học.');
    }
  };

  // --- SECTION CRUD ---
  const openSectionModal = (mode, section = null) => {
    setModalMode(mode);
    setEditItem(section);
    setFormError('');
    if (mode === 'create') {
      setSectionTitle('');
      setSectionOrder(activeCourse?.sections?.length + 1 || 1);
    } else {
      setSectionTitle(section.title);
      setSectionOrder(section.order || 1);
    }
    setActiveModal('section');
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return setFormError('Tiêu đề không được để trống');
    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      let res;
      if (modalMode === 'create') {
        res = await axios.post(`/api/v1/teacher/courses/${activeCourse.id}/sections`, { title: sectionTitle, order: Number(sectionOrder) }, { headers });
      } else {
        res = await axios.put(`/api/v1/teacher/sections/${editItem.id}`, { title: sectionTitle, order: Number(sectionOrder) }, { headers });
      }

      setSuccessMsg(modalMode === 'create' ? 'Đã thêm chương học mới!' : 'Đã sửa chương học thành công!');
      setActiveModal(null);
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Lỗi khi lưu chương học.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionDelete = async (id) => {
    if (!window.confirm('Xóa chương học này sẽ xóa toàn bộ bài giảng bên trong. Bạn chắc chắn chứ?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/v1/teacher/sections/${id}`, { headers });
      setSuccessMsg('Đã xóa chương học!');
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Lỗi khi xóa chương học.');
    }
  };

  // --- LESSON CRUD ---
  const openLessonModal = (mode, targetSecId, lesson = null) => {
    setModalMode(mode);
    setTargetSectionId(targetSecId);
    setEditItem(lesson);
    setFormError('');
    setUploadSource('link');
    setIsUploadingVideo(false);
    if (mode === 'create') {
      setLessonTitle('');
      setLessonType('video');
      setLessonVideoUrl('');
      setLessonDocUrl('');
      setLessonContent('');
      setLessonDuration(0);
      setLessonOrder(1);
    } else {
      setLessonTitle(lesson.title);
      setLessonType(lesson.type);
      setLessonVideoUrl(lesson.video_url || '');
      setLessonDocUrl(lesson.document_url || '');
      setLessonContent(lesson.content || '');
      setLessonDuration(lesson.duration || 0);
      setLessonOrder(lesson.order || 1);
    }
    setActiveModal('lesson');
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return setFormError('Tiêu đề bài học không được để trống');
    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        title: lessonTitle,
        type: lessonType,
        video_url: lessonVideoUrl,
        document_url: lessonDocUrl,
        content: lessonContent,
        duration: Number(lessonDuration),
        order: Number(lessonOrder),
      };

      if (modalMode === 'create') {
        await axios.post(`/api/v1/teacher/sections/${targetSectionId}/lessons`, body, { headers });
      } else {
        await axios.put(`/api/v1/teacher/lessons/${editItem.id}`, body, { headers });
      }

      setSuccessMsg(modalMode === 'create' ? 'Đã thêm bài giảng mới!' : 'Đã sửa bài giảng!');
      setActiveModal(null);
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Lỗi khi lưu bài giảng.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setFormError('Dung lượng video tối đa là 500MB (Vượt quá giới hạn máy chủ)');
      return;
    }

    setIsUploadingVideo(true);
    setFormError('');

    const formData = new FormData();
    formData.append('video', file);

    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      const res = await axios.post('/api/v1/teacher/lessons/upload-video', formData, { headers });
      if (res.data && res.data.success && res.data.video_url) {
        setLessonVideoUrl(res.data.video_url);
        setSuccessMsg('Tải video lên thành công!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setFormError('Không nhận được liên kết video từ máy chủ.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi tải video.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleLessonDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa bài giảng này không?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/v1/teacher/lessons/${id}`, { headers });
      setSuccessMsg('Đã xóa bài giảng thành công!');
      fetchCourseDetails(activeCourse.id);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Lỗi khi xóa bài giảng.');
    }
  };

  // --- ATTACHMENT CRUD ---
  const openAttachmentModal = (lesson) => {
    setTargetLessonId(lesson.id);
    setAttachmentName('');
    setAttachmentUrl('');
    setAttachmentSize(0);
    setFormError('');
    setActiveModal('attachment');
  };

  const handleAttachmentSubmit = async (e) => {
    e.preventDefault();
    if (!attachmentName.trim() || !attachmentUrl.trim()) return setFormError('Tên và liên kết tài liệu không được để trống');
    setIsSaving(true);
    setFormError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        file_name: attachmentName,
        file_url: attachmentUrl,
        file_size: Number(attachmentSize),
      };
      await axios.post(`/api/v1/teacher/lessons/${targetLessonId}/attachments`, body, { headers });
      
      setSuccessMsg('Đã thêm tài liệu đính kèm thành công!');
      setActiveModal(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.message || 'Lỗi khi lưu tài liệu đính kèm.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* Title Panel */}
      <div className="flex flex-row justify-between items-center gap-2 md:gap-4 bg-slate-900/20 border border-slate-900 p-3 md:p-6 rounded-2xl md:rounded-3xl">
        <div className="min-w-0">
          <h1 className="font-serif text-sm md:text-2xl font-bold text-slate-100 flex items-center gap-1.5 md:gap-2.5 truncate">
            <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-amber-500 flex-shrink-0" />
            <span className="truncate">Quản Lý Học Liệu & Bài Giảng</span>
          </h1>
          <p className="text-[8px] md:text-xs text-slate-400 mt-0.5 md:mt-1 truncate">Biên soạn nội dung giảng dạy, chia đoạn chương trình học và tải tài liệu/video bài giảng.</p>
        </div>
        <button
          onClick={() => openCourseModal('create')}
          title="Tạo khóa học mới"
          className="p-2 md:py-2.5 md:px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl flex items-center justify-center gap-1.5 transition flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden md:inline">Tạo khóa học mới</span>
        </button>
      </div>

      {/* Alerts */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{typeof apiError === 'object' ? (apiError.message || JSON.stringify(apiError)) : apiError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Builder Dashboard Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Left Side: Course List Selector */}
        <div className="bg-slate-900/20 border border-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl h-[calc(100vh-220px)] md:h-[calc(100vh-270px)] overflow-y-auto">
          <h3 className="text-[9px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 md:mb-4">Danh sách khóa học của bạn</h3>
          
          {isLoading && courses.length === 0 ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" /></div>
          ) : courses.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-10">Bạn chưa tạo khóa học nào.</p>
          ) : (
            <div className="space-y-1.5 md:space-y-2">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  onClick={() => fetchCourseDetails(course.id)}
                  className={`p-2.5 md:p-3.5 rounded-lg md:rounded-xl border cursor-pointer transition flex items-center justify-between group ${activeCourse?.id === course.id ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-950/30 border-slate-900 text-slate-400 hover:border-slate-800'}`}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] md:text-xs font-semibold block truncate">{course.title}</span>
                    <span className="text-[8px] md:text-[10px] text-slate-500 block mt-0.5">{course.price?.toLocaleString('vi-VN')}đ • Quyền: {course.status}</span>
                  </div>
                  
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openCourseModal('edit', course); }}
                      className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-400 hover:text-amber-500"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCourseDelete(course.id); }}
                      className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Program Structure (Section & Lesson Manager) */}
        <div className="lg:col-span-2 bg-slate-900/10 border border-slate-900 rounded-xl md:rounded-2xl p-3 md:p-6 h-[calc(100vh-220px)] md:h-[calc(100vh-270px)] overflow-y-auto">
          {activeCourse ? (
            <div className="space-y-4 md:space-y-6">
              
              {/* Active Course Banner */}
              <div className="border-b border-slate-900 pb-3 md:pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div>
                  <h2 className="text-sm md:text-lg font-bold text-slate-100 font-serif">{activeCourse.title}</h2>
                  <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 md:mt-1">{activeCourse.subtitle || "Không có phụ đề mô tả"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {activeCourse.status === 'draft' && (
                    <button
                      onClick={() => handleUpdateCourseStatus(activeCourse.id, 'pending')}
                      className="p-1.5 md:py-2 md:px-3.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 text-[9px] md:text-xs font-bold rounded-lg md:rounded-xl flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>Gửi duyệt</span>
                    </button>
                  )}
                  {activeCourse.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateCourseStatus(activeCourse.id, 'draft')}
                      className="p-1.5 md:py-2 md:px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-[9px] md:text-xs font-bold rounded-lg md:rounded-xl flex items-center gap-1.5 transition"
                    >
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>Hủy duyệt</span>
                    </button>
                  )}
                  {activeCourse.status === 'published' && (
                    <span className="p-1.5 md:py-2 md:px-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] md:text-xs font-bold rounded-lg md:rounded-xl flex items-center gap-1.5 cursor-default">
                      <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>Đã xuất bản</span>
                    </span>
                  )}
                  <button
                    onClick={() => fetchStudentProgress(activeCourse.id)}
                    disabled={isLoadingProgress}
                    className="p-1.5 md:py-2 md:px-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-amber-500/40 text-amber-500 text-[9px] md:text-xs font-semibold rounded-lg md:rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isLoadingProgress ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Layers className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    <span>Xem tiến độ</span>
                  </button>
                  <button
                    onClick={() => openSectionModal('create')}
                    className="p-1.5 md:py-2 md:px-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 text-[9px] md:text-xs font-bold rounded-lg md:rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>Thêm chương</span>
                  </button>
                </div>
              </div>

              {/* Sections Accordion Accord */}
              {activeCourse.sections?.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-900 rounded-2xl">
                  Khóa học này chưa có chương học nào. Hãy bấm "Thêm chương học" để bắt đầu thiết lập chương trình học tập!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCourse.sections?.map((section) => {
                    const isExpanded = expandedSections[section.id];
                    return (
                      <div key={section.id} className="border border-slate-900 rounded-2xl bg-slate-950/20 overflow-hidden">
                        
                        {/* Section Header Accord */}
                        <div 
                          onClick={() => toggleSection(section.id)}
                          className="p-3 md:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0 cursor-pointer hover:bg-slate-900/20 transition"
                        >
                          <div className="flex items-start md:items-center gap-2 md:gap-3 min-w-0">
                            <div className="flex-shrink-0 mt-0.5 md:mt-0">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />}
                            </div>
                            <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 flex-shrink-0 mt-0.5 md:mt-0" />
                            <div className="min-w-0">
                              <span className="text-[11px] md:text-xs font-semibold text-slate-200 block truncate">{section.title}</span>
                              <span className="text-[9px] md:text-[10px] text-slate-500 font-mono block mt-0.5">
                                ({section.lessons?.length || 0} BG, {section.quizzes?.length || 0} BT, {section.assignments?.length || 0} BTH)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 ml-6 md:ml-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openLessonModal('create', section.id)}
                              className="p-1.5 md:py-1 md:px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-905 text-[10px] font-bold text-amber-500 rounded-lg flex items-center gap-1"
                              title="Thêm bài giảng mới"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden xl:inline">Bài giảng</span>
                            </button>
                            <button
                              onClick={() => openQuizModal('create', section.id)}
                              className="p-1.5 md:py-1 md:px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-905 text-[10px] font-bold text-amber-500 rounded-lg flex items-center gap-1"
                              title="Thêm bài thi trắc nghiệm mới"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden xl:inline">Bài thi</span>
                            </button>
                            <button
                              onClick={() => openAssignmentModal('create', section.id)}
                              className="p-1.5 md:py-1 md:px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-905 text-[10px] font-bold text-amber-500 rounded-lg flex items-center gap-1"
                              title="Thêm bài tập thực hành mới"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden xl:inline">Bài tập</span>
                            </button>
                            <button
                              onClick={() => openSectionModal('edit', section)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-905 hover:border-amber-500 text-slate-400 hover:text-amber-500"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSectionDelete(section.id)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-905 hover:border-red-950 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Section Lessons, Quizzes and Assignments List Accord */}
                        {isExpanded && (
                          <div className="border-t border-slate-900/50 bg-[#070b13]/40 p-4 space-y-3 animate-fade-in">
                            {(!section.lessons || section.lessons.length === 0) && 
                             (!section.quizzes || section.quizzes.length === 0) && 
                             (!section.assignments || section.assignments.length === 0) ? (
                              <p className="text-[11px] text-slate-500 text-center py-4">Chương này chưa có nội dung bài giảng, bài thi hay bài tập nào.</p>
                            ) : (
                              <>
                                {/* Lessons List */}
                                {section.lessons?.map((lesson) => (
                                  <div 
                                    key={lesson.id}
                                    className="p-3 bg-slate-950/50 border border-slate-900 hover:border-slate-800 rounded-xl flex items-center justify-between group/lesson"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {lesson.type === 'video' ? <Video className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-sky-400" />}
                                      <div className="min-w-0">
                                        <span className="text-[11px] font-semibold text-slate-300 block truncate">{lesson.title}</span>
                                        {lesson.type === 'video' && (
                                          <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <span>{Math.round(lesson.duration / 60)} phút</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover/lesson:opacity-100 transition">
                                      <button
                                        onClick={() => {
                                          setTargetLessonId(lesson.id);
                                          setActiveModal('qna');
                                        }}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-400 hover:text-amber-500"
                                        title="Hỏi đáp / Giải đáp thắc mắc"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => openAttachmentModal(lesson)}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-sky-500 text-slate-400 hover:text-sky-500"
                                        title="Thêm tài liệu đính kèm"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => openLessonModal('edit', section.id, lesson)}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-400 hover:text-amber-500"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleLessonDelete(lesson.id)}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-500"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {/* Quizzes List */}
                                {section.quizzes?.map((quiz) => (
                                  <div 
                                    key={quiz.id}
                                    className="p-3.5 bg-slate-950/70 border border-slate-900 hover:border-amber-500/20 rounded-xl flex flex-col gap-2.5 transition-all group/quiz"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <FileCode className="w-4 h-4 text-amber-500" />
                                        <div className="min-w-0">
                                          <span className="text-[11px] font-bold text-amber-500 block truncate">{quiz.title}</span>
                                          <span className="text-[9px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                                            <span>Điểm đạt: {quiz.passing_score}%</span>
                                            <span>•</span>
                                            <span>Thời lượng: {quiz.duration} phút</span>
                                            <span>•</span>
                                            <span>Số lần thử: {quiz.max_attempts}</span>
                                            <span>•</span>
                                            <span className="text-amber-500 font-semibold">{quiz.questions?.length || 0} câu hỏi</span>
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 opacity-0 group-hover/quiz:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => openQuestionFormModal(quiz)}
                                          className="py-1 px-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500 text-[10px] font-bold text-amber-500 rounded-lg flex items-center gap-1 transition-all"
                                          title="Soạn câu hỏi mới"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Soạn câu hỏi</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Questions and Answers Preview */}
                                    {quiz.questions && quiz.questions.length > 0 && (
                                      <div className="pl-6 border-l border-slate-900 space-y-2.5 mt-1.5">
                                        {quiz.questions.map((q, qIndex) => (
                                          <div key={q.id} className="text-[10px] text-slate-400 space-y-1 bg-slate-900/10 p-2 rounded-lg">
                                            <div className="font-semibold text-slate-300">
                                              Câu {qIndex + 1}: {q.question_text} <span className="text-[8px] font-mono px-1 rounded bg-slate-950 text-slate-500 ml-1">({q.type === 'multiple' ? 'chọn nhiều' : 'chọn một'})</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1.5">
                                              {q.answers?.map((ans, aIndex) => (
                                                <div key={ans.id} className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                  <span className="truncate">{ans.answer_text}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Assignments List */}
                                {section.assignments?.map((assignment) => (
                                  <div 
                                    key={assignment.id}
                                    className="p-3.5 bg-slate-950/70 border border-slate-900 hover:border-amber-500/20 rounded-xl flex flex-col gap-2 transition-all group/assignment"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <CheckSquare className="w-4 h-4 text-sky-450" />
                                        <div className="min-w-0">
                                          <span className="text-[11px] font-bold text-sky-450 block truncate">{assignment.title}</span>
                                          <span className="text-[9px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                                            <span>Điểm tối đa: {assignment.max_score} điểm</span>
                                            <span>•</span>
                                            <span>Hạn nộp: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('vi-VN') : '—'}</span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {assignment.description && (
                                      <p className="text-[10px] text-slate-400 pl-7 leading-relaxed whitespace-pre-line">{assignment.description}</p>
                                    )}
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center py-20 text-xs text-slate-500">
              Chọn một khóa học ở danh sách bên trái hoặc bấm "Tạo khóa học mới" để bắt đầu biên soạn chương trình học liệu.
            </div>
          )}
        </div>

      </div>

      {/* --- MODAL POPUPS --- */}
      {createPortal(
        <>

      {/* Modal 1: Course Form */}
      {activeModal === 'course' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-[320px] md:max-w-[400px] w-full max-h-[85vh] overflow-y-auto border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-3 md:top-4 right-3 md:right-4 text-slate-500 hover:text-slate-300"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <h3 className="font-serif text-sm md:text-base font-bold text-slate-100 mb-4 md:mb-6">{modalMode === 'create' ? 'Tạo Khóa Học Mới' : 'Cập Nhật Khóa Học'}</h3>

            {formError && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 rounded-lg md:rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-[10px] md:text-xs flex gap-2"><AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tiêu đề khóa học</label>
                <input type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="Nhập tiêu đề học..." className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Phụ đề ngắn</label>
                <input type="text" value={courseSubtitle} onChange={e => setCourseSubtitle(e.target.value)} placeholder="Mô tả tóm tắt khóa học..." className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Mô tả chương trình học</label>
                <textarea value={courseDescription} onChange={e => setCourseDescription(e.target.value)} placeholder="Nhập nội dung giảng dạy..." rows={4} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Học phí (VND)</label>
                  <input type="number" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Danh mục chuyên ngành</label>
                  <select value={courseCategory} onChange={e => setCourseCategory(e.target.value)} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Ảnh bìa khóa học</label>
                <div className="flex items-center gap-4">
                  {courseThumbnailUrl && (
                    <img src={courseThumbnailUrl} alt="Thumbnail preview" className="w-24 h-16 object-cover rounded-lg border border-slate-700" />
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0c101a] border border-slate-800 hover:border-amber-500/50 rounded-xl text-slate-300 text-[11px] cursor-pointer transition w-full">
                    {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Upload className="w-4 h-4 text-amber-500" />}
                    <span>{isUploadingImage ? 'Đang tải lên...' : (courseThumbnailUrl ? 'Thay đổi ảnh bìa' : 'Tải ảnh bìa lên (Max 5MB)')}</span>
                    <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{modalMode === 'create' ? 'Tạo mới' : 'Lưu lại'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Section Form */}
      {activeModal === 'section' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-[320px] md:max-w-sm w-full max-h-[85vh] overflow-y-auto border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-3 md:top-4 right-3 md:right-4 text-slate-500 hover:text-slate-300"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <h3 className="font-serif text-sm md:text-base font-bold text-slate-100 mb-4 md:mb-6">{modalMode === 'create' ? 'Thêm Chương Học Mới' : 'Sửa Chương Học'}</h3>

            {formError && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 rounded-lg md:rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-[10px] md:text-xs flex gap-2"><AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleSectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tiêu đề chương học</label>
                <input type="text" value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder="Chương 1: Khái niệm cơ bản..." className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Thứ tự sắp xếp (Order)</label>
                <input type="number" value={sectionOrder} onChange={e => setSectionOrder(e.target.value)} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lưu chương học</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Lesson Form */}
      {activeModal === 'lesson' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-[320px] md:max-w-[420px] w-full max-h-[85vh] overflow-y-auto border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-3 md:top-4 right-3 md:right-4 text-slate-500 hover:text-slate-300"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <h3 className="font-serif text-sm md:text-base font-bold text-slate-100 mb-4 md:mb-6">{modalMode === 'create' ? 'Tạo Bài Giảng Mới' : 'Cập Nhật Bài Giảng'}</h3>

            {formError && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 rounded-lg md:rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-[10px] md:text-xs flex gap-2"><AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleLessonSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tiêu đề bài học</label>
                  <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="1.1 Giới thiệu fiber..." className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Định dạng học liệu</label>
                  <select value={lessonType} onChange={e => setLessonType(e.target.value)} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition">
                    <option value="video">Bài giảng Video</option>
                    <option value="document">Tài liệu đọc</option>
                  </select>
                </div>
              </div>

              {lessonType === 'video' ? (
                <div className="space-y-3">
                  {/* Source Tab Switcher */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => { setUploadSource('link'); }}
                      className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${uploadSource === 'link' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      Dán Link URL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUploadSource('file'); }}
                      className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${uploadSource === 'file' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload từ máy
                    </button>
                  </div>

                  {/* Link Panel */}
                  {uploadSource === 'link' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                          Link YouTube hoặc URL video (mp4, Cloudinary...)
                        </label>
                        <input
                          type="text"
                          value={lessonVideoUrl}
                          onChange={e => setLessonVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... hoặc https://res.cloudinary.com/..."
                          className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition text-xs"
                        />
                        <p className="text-[9px] text-slate-500 mt-1.5">Hỗ trợ link YouTube, Vimeo, Cloudinary, hay bất kỳ URL video MP4 nào.</p>
                      </div>

                      {/* YouTube Preview */}
                      {lessonVideoUrl && (lessonVideoUrl.includes('youtube.com') || lessonVideoUrl.includes('youtu.be')) && (() => {
                        const ytMatch = lessonVideoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        const ytId = ytMatch ? ytMatch[1] : null;
                        return ytId ? (
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video relative group">
                            <img
                              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                              alt="YouTube thumbnail"
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </div>
                              <span className="text-[9px] text-white/80 font-semibold mt-1 bg-black/50 px-2 py-0.5 rounded-full">YouTube Preview</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Upload Panel */}
                  {uploadSource === 'file' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Chọn file video từ máy tính</label>
                      
                      {/* Drop Zone */}
                      <label
                        htmlFor="video-file-input"
                        className={`relative flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${isUploadingVideo ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-700 hover:border-amber-500/50 bg-slate-950/30 hover:bg-amber-500/5'}`}
                      >
                        {isUploadingVideo ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-semibold text-amber-400">Đang tải lên Cloudinary...</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Vui lòng không đóng cửa sổ này</p>
                            </div>
                          </>
                        ) : lessonVideoUrl && uploadSource === 'file' ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-semibold text-emerald-400">Upload thành công!</p>
                              <p className="text-[9px] text-slate-400 mt-0.5 max-w-[220px] truncate">{lessonVideoUrl}</p>
                            </div>
                            <span className="text-[9px] text-slate-500 underline">Bấm để thay video khác</span>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-semibold text-slate-300">Kéo thả video vào đây</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">hoặc bấm để chọn file — MP4, MOV, AVI (tối đa 500MB)</p>
                            </div>
                          </>
                        )}
                        <input
                          id="video-file-input"
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          disabled={isUploadingVideo}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                      
                      {/* Manual URL fallback */}
                      {lessonVideoUrl && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          <span className="text-[9px] text-slate-400 truncate flex-1">{lessonVideoUrl}</span>
                          <button type="button" onClick={() => setLessonVideoUrl('')} className="text-slate-500 hover:text-red-400 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Duration input - always show for video */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Thời lượng video (giây)</label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={e => setLessonDuration(e.target.value)}
                      placeholder="VD: 600 (= 10 phút)"
                      className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Document URL</label>
                    <input type="text" value={lessonDocUrl} onChange={e => setLessonDocUrl(e.target.value)} placeholder="https://docs.google.com/..." className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Thứ tự bài giảng (Order)</label>
                    <input type="number" value={lessonOrder} onChange={e => setLessonOrder(e.target.value)} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
                  </div>
                </div>
              )}

              {lessonType === 'document' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Nội dung bài học (Markdown/Text)</label>
                  <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="Nhập bài viết giáo án..." rows={5} className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lưu bài giảng</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Student Progress List */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-2xl w-full border border-slate-800 rounded-3xl p-6 relative shadow-2xl flex flex-col max-h-[85vh]">
            <button onClick={() => setIsProgressModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            <h3 className="font-serif text-base font-bold text-slate-100 mb-2">Tiến Độ Học Viên</h3>
            <p className="text-[10px] text-slate-400 mb-6">Theo dõi danh sách sinh viên đang ghi danh và tiến trình học tập của họ.</p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {studentProgress.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">Chưa có học viên nào ghi danh khóa học này.</div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/50">
                          <th className="p-3 font-semibold">Học viên</th>
                          <th className="p-3 font-semibold">Ngày ghi danh</th>
                          <th className="p-3 font-semibold">Tiến độ (%)</th>
                          <th className="p-3 font-semibold text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentProgress.map((prog) => {
                          const isCompleted = prog.progress_percentage === 100;
                          return (
                            <tr key={prog.id} className="border-b border-slate-850 hover:bg-slate-900/30 transition">
                              <td className="p-3">
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-200 block truncate">{prog.student?.name || `Học viên #${prog.student_id}`}</span>
                                  <span className="text-[10px] text-slate-500 block truncate">{prog.student?.email || ''}</span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-400 font-mono text-[10px]">
                                {prog.enrolled_at ? new Date(prog.enrolled_at).toLocaleDateString('vi-VN') : '—'}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                      style={{ width: `${prog.progress_percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-bold font-mono text-slate-300">{prog.progress_percentage}%</span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                {isCompleted ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    Đã hoàn thành
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                                    Đang học
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setIsProgressModalOpen(false)} 
                className="py-2.5 px-6 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 font-semibold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Quiz Form */}
      {activeModal === 'quiz' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-[320px] md:max-w-sm w-full max-h-[85vh] overflow-y-auto border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-3 md:top-4 right-3 md:right-4 text-slate-500 hover:text-slate-300"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <h3 className="font-serif text-sm md:text-base font-bold text-slate-100 mb-4 md:mb-6">Thêm Bài Thi Trắc Nghiệm Mới</h3>

            {formError && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 rounded-lg md:rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-[10px] md:text-xs flex gap-2"><AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleQuizSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tiêu đề bài trắc nghiệm</label>
                <input 
                  type="text" 
                  value={quizTitle} 
                  onChange={e => setQuizTitle(e.target.value)} 
                  placeholder="Ví dụ: Bài thi cuối khóa..." 
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Điểm đạt (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={quizPassingScore} 
                    onChange={e => setQuizPassingScore(e.target.value)} 
                    className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Thời lượng (phút)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="180" 
                    value={quizDuration} 
                    onChange={e => setQuizDuration(e.target.value)} 
                    className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Số lần thử tối đa</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={quizMaxAttempts} 
                    onChange={e => setQuizMaxAttempts(e.target.value)} 
                    className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Tạo bài thi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Question Form */}
      {activeModal === 'question' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-lg w-full border border-slate-800 rounded-3xl p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            <h3 className="font-serif text-base font-bold text-slate-100 mb-1">Soạn Câu Hỏi Trắc Nghiệm</h3>
            <p className="text-[10px] text-slate-400 mb-6">Thêm câu hỏi cho bài thi: <span className="text-amber-500 font-semibold">{activeQuizForQuestions?.title}</span></p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleQuestionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Nội dung câu hỏi</label>
                <textarea 
                  value={questionText} 
                  onChange={e => setQuestionText(e.target.value)} 
                  placeholder="Nhập nội dung câu hỏi..." 
                  rows={3}
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Loại câu hỏi</label>
                <select 
                  value={questionType} 
                  onChange={e => setQuestionType(e.target.value)} 
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition"
                >
                  <option value="single">Một đáp án đúng (Single Choice)</option>
                  <option value="multiple">Nhiều đáp án đúng (Multiple Choice)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Danh sách câu trả lời và đáp án đúng</label>
                
                {answersInput.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#0c101a] p-3 rounded-xl border border-slate-800">
                    <span className="font-mono text-slate-500 text-[10px] font-bold">{String.fromCharCode(65 + idx)}.</span>
                    <input 
                      type="text" 
                      value={ans.text} 
                      onChange={e => {
                        const updated = [...answersInput];
                        updated[idx].text = e.target.value;
                        setAnswersInput(updated);
                      }} 
                      placeholder={`Nhập nội dung đáp án ${String.fromCharCode(65 + idx)}...`} 
                      className="flex-1 bg-transparent text-slate-200 focus:outline-none text-xs" 
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={ans.isCorrect} 
                        onChange={e => {
                          const updated = [...answersInput];
                          if (questionType === 'single') {
                            // Uncheck all others
                            updated.forEach((a, i) => {
                              a.isCorrect = i === idx ? e.target.checked : false;
                            });
                          } else {
                            updated[idx].isCorrect = e.target.checked;
                          }
                          setAnswersInput(updated);
                        }} 
                        className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer" 
                      />
                      <span className="text-[10px] text-slate-400 font-semibold select-none">Đúng</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lưu câu hỏi</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Assignment Form */}
      {activeModal === 'assignment' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-[320px] md:max-w-sm w-full max-h-[85vh] overflow-y-auto border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-3 md:top-4 right-3 md:right-4 text-slate-500 hover:text-slate-300"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            <h3 className="font-serif text-sm md:text-base font-bold text-slate-100 mb-4 md:mb-6">Thêm Bài Tập Tự Luận Mới</h3>

            {formError && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 rounded-lg md:rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-[10px] md:text-xs flex gap-2"><AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleAssignmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tiêu đề bài tập</label>
                <input 
                  type="text" 
                  value={assignmentTitle} 
                  onChange={e => setAssignmentTitle(e.target.value)} 
                  placeholder="Ví dụ: Bài tập thực hành chương 1..." 
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Mô tả chi tiết bài tập</label>
                <textarea 
                  value={assignmentDescription} 
                  onChange={e => setAssignmentDescription(e.target.value)} 
                  placeholder="Mô tả các yêu cầu, đường dẫn tham khảo, hoặc hướng dẫn nộp bài..." 
                  rows={4}
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Điểm tối đa</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={assignmentMaxScore} 
                    onChange={e => setAssignmentMaxScore(e.target.value)} 
                    className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Hạn nộp bài</label>
                  <input 
                    type="datetime-local" 
                    value={assignmentDueDate} 
                    onChange={e => setAssignmentDueDate(e.target.value)} 
                    className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Tạo bài tập</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 8: Attachment Form */}
      {activeModal === 'attachment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-md w-full border border-slate-800 rounded-3xl p-6 relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            <h3 className="font-serif text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-400" />
              <span>Thêm Tài Liệu Đính Kèm</span>
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{typeof formError === 'object' ? (formError.message || JSON.stringify(formError)) : formError}</span></div>
            )}

            <form onSubmit={handleAttachmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Tên tài liệu</label>
                <input 
                  type="text" 
                  value={attachmentName} 
                  onChange={e => setAttachmentName(e.target.value)} 
                  placeholder="Ví dụ: Slide bài giảng PDF..." 
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Liên kết tài liệu (URL)</label>
                <input 
                  type="text" 
                  value={attachmentUrl} 
                  onChange={e => setAttachmentUrl(e.target.value)} 
                  placeholder="https://docs.google.com/... hoặc link PDF trực tiếp" 
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
                <p className="text-[9px] text-slate-500 mt-1">Cung cấp liên kết tải xuống hoặc xem trực tiếp tài liệu.</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Kích thước file (bytes) (Tùy chọn)</label>
                <input 
                  type="number" 
                  min="0"
                  value={attachmentSize} 
                  onChange={e => setAttachmentSize(e.target.value)} 
                  className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-800 focus:border-amber-500/50 rounded-xl text-slate-200 focus:outline-none transition" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-350 font-semibold rounded-xl transition">Hủy bỏ</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-sky-500 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Thêm tài liệu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 9: Q&A / Discussions */}
      {activeModal === 'qna' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-2xl w-full max-h-[80vh] border border-slate-800 rounded-3xl p-6 relative shadow-2xl flex flex-col">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            <h3 className="font-serif text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <span>Giải đáp thắc mắc bài giảng</span>
            </h3>

            <div className="flex-1 overflow-y-auto">
              <LessonDiscussion lessonId={targetLessonId} token={token} />
            </div>
          </div>
        </div>
      )}
        </>,
        document.body
      )}
    </div>
  );
}
