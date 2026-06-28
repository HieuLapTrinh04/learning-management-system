import React, { useEffect, useRef, Suspense, lazy, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import axiosClient from './api/axiosClient';
import {
  Award,
  RefreshCw,
  ShieldAlert,
  Activity
} from 'lucide-react';

// Import Layouts & Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleProtectedRoute from './routes/RoleProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import PublicLayout from './layouts/PublicLayout';

// Import Authentication Features
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import VerifyEmailPage from './features/auth/VerifyEmailPage';
import {
  initializeAuth,
  updateAccessToken,
  clearAuthSession,
  logoutUser,
  updateUserName
} from './features/auth/authSlice';

// Lazy Load Feature Pages to reduce initial bundle size
const CategoryManager = lazy(() => import('./features/courses/CategoryManager'));
const CourseBuilder = lazy(() => import('./features/courses/CourseBuilder'));
const StudentCoursesPage = lazy(() => import('./features/courses/StudentCoursesPage'));
const StudentMyLearningPage = lazy(() => import('./features/learning/StudentMyLearningPage'));
const StudentRoadmaps = lazy(() => import('./features/learning/StudentRoadmaps'));
const AdminTransactions = lazy(() => import('./features/payment/AdminTransactions'));
const StudentAssignmentsPage = lazy(() => import('./features/assignment/StudentAssignmentsPage'));
const TeacherAssignmentsPage = lazy(() => import('./features/assignment/TeacherAssignmentsPage'));
const TeacherTransactions = lazy(() => import('./features/payment/TeacherTransactions'));
const TeacherWithdrawals = lazy(() => import('./features/payment/TeacherWithdrawals'));
const AdminWithdrawals = lazy(() => import('./features/payment/AdminWithdrawals'));
const StudentQuizPage = lazy(() => import('./features/quiz/StudentQuizPage'));
const AdminApproveCourses = lazy(() => import('./features/admin/AdminApproveCourses'));
const AdminTestimonials = lazy(() => import('./features/admin/AdminTestimonials'));
const ProfileSettings = lazy(() => import('./features/profile/ProfileSettings'));

import CouponManager from './features/coupon/CouponManager';
import StudentCertificates from './features/certificate/StudentCertificates';
import CertificateVerifier from './features/certificate/CertificateVerifier';
import PaymentHistory from './features/payment/PaymentHistory';
import PaymentResultPage from './features/payment/PaymentResultPage';
import VNPayMockPage from './features/payment/VNPayMockPage';
import NotificationPage from './features/notification/NotificationPage';
import CartPage from './features/cart/CartPage';
import CheckoutPage from './features/cart/CheckoutPage';
import ReviewModeration from './features/review/ReviewModeration';
import AuditLogViewer from './features/audit/AuditLogViewer';

// Dashboard Slices
import { fetchAdminDashboard, fetchTeacherDashboard, fetchStudentDashboard } from './features/dashboard/dashboardSlice';
const AdminDashboard = lazy(() => import('./features/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./features/dashboard/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./features/dashboard/StudentDashboard'));
const AdminManageUsers = lazy(() => import('./features/admin/AdminManageUsers'));
const AdminLearningPaths = lazy(() => import('./features/admin/AdminLearningPaths'));

// Import Notification Redux Slices
import { fetchNotifications, addNotification, setWsConnected, clearNotifications } from './features/notification/notificationSlice';
import { fetchTenantConfig } from './features/tenant/tenantSlice';
const LandingPage = lazy(() => import('./features/public/LandingPage'));

// Create a global Auth Context to avoid prop-drilling
export const AuthContext = React.createContext();

export default function App() {
  const dispatch = useDispatch();
  const { token, role, userName, userId, status } = useSelector((state) => state.auth);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState(null);
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('lms_user_avatar') || null);

  const location = useLocation();
  const socketRef = useRef(null);

  // Initialize Authentication State on Startup
  useEffect(() => {
    dispatch(fetchTenantConfig());
    dispatch(initializeAuth());
  }, [dispatch]);

  // Handle cross-tab or interceptor auto-refresh events
  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      dispatch(updateAccessToken(e.detail));
    };

    const handleAuthLogout = () => {
      dispatch(clearAuthSession());
    };

    window.addEventListener('lms-token-refreshed', handleTokenRefreshed);
    window.addEventListener('lms-auth-logout', handleAuthLogout);

    return () => {
      window.removeEventListener('lms-token-refreshed', handleTokenRefreshed);
      window.removeEventListener('lms-auth-logout', handleAuthLogout);
    };
  }, [dispatch]);

  const handleLoginSuccess = () => {
    // Session is handled automatically by authSlice extraReducers
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearNotifications());
    setUserAvatar(null);
    localStorage.removeItem('lms_user_avatar');
  };

  const updateName = (name) => {
    if (name) {
      dispatch(updateUserName(name));
    }
  };

  const updateAvatar = (url) => {
    setUserAvatar(url);
    if (url) {
      localStorage.setItem('lms_user_avatar', url);
    } else {
      localStorage.removeItem('lms_user_avatar');
    }
  };

  const fetchDashboardData = () => {
    if (!token || !role) return;
    if (role === 'admin') {
      dispatch(fetchAdminDashboard(token));
    } else if (role === 'teacher') {
      dispatch(fetchTeacherDashboard(token));
    } else if (role === 'student') {
      dispatch(fetchStudentDashboard(token));
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      dispatch(fetchNotifications(token));

      // Fetch user profile to get avatar and name
      axios.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data?.data) {
          if (res.data.data.avatar_url) updateAvatar(res.data.data.avatar_url);
          if (res.data.data.name) updateName(res.data.data.name);
        }
      }).catch(err => console.error('Failed to fetch user profile', err));

      let ws = null;

      const connectWebSocket = async () => {
        try {
          const apiBaseUrl = import.meta.env.VITE_API_URL || '';
          const res = await axiosClient.get('/api/v1/ws/ticket');
          const data = res.data;
          if (!data.ticket) return;

          let wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
          if (!wsBaseUrl) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsBaseUrl = `${protocol}//${window.location.host}`;
          }
          
          const wsUrl = `${wsBaseUrl}/api/v1/ws/notifications?ticket=${data.ticket}`;

          console.log('Connecting to WebSocket notifications:', wsUrl);
          ws = new WebSocket(wsUrl);
          socketRef.current = ws;

          ws.onopen = () => {
            dispatch(setWsConnected(true));
          };

          ws.onmessage = (event) => {
            try {
              const notification = JSON.parse(event.data);
              console.log('Received WebSocket notification:', notification);

              dispatch(addNotification(notification));
              setToastNotification(notification);

              setTimeout(() => {
                setToastNotification(null);
              }, 5000);

              fetchDashboardData();
            } catch (err) {
              console.error('WebSocket message parsing error:', err);
            }
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed');
            dispatch(setWsConnected(false));
          };

          ws.onerror = (err) => {
            console.error('WebSocket connection error:', err);
          };
        } catch (err) {
          console.error("Failed to fetch WS ticket", err);
        }
      };

      connectWebSocket();

      return () => {
        if (ws) ws.close();
      };
    }
  }, [token, role, dispatch]);

  return (
    <AuthContext.Provider value={{ token, role, userName, userId, userAvatar, updateAvatar, updateName, handleLogout, handleLoginSuccess }}>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-slate-950">

        {/* Dynamic Toast Popup */}
        {toastNotification && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-brand-500/30 shadow-2xl rounded-2xl p-4 flex gap-4 animate-bounce">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
              <Award className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-brand-500">{toastNotification.title || 'Thông báo mới'}</span>
                <span className="text-[10px] text-slate-400">Vừa xong</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{toastNotification.message}</p>
            </div>
          </div>
        )}

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Route>

            <Route path="/certificates/verify" element={<CertificateVerifier />} />

            {/* Root Path - Public Landing Page */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Protected Routes Area */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRedirector />} />

              <Route path="/admin" element={<Navigate to="/admin/bang-dieu-khien" replace />} />
              <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

              {/* Admin Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/bang-dieu-khien" element={<AdminDashboardWrapper />} />
                  <Route path="/admin/quan-ly-nguoi-dung" element={<AdminManageUsers />} />
                  <Route path="/admin/danh-muc" element={<CategoryManager />} />
                  <Route path="/admin/quan-ly-lo-trinh" element={<AdminLearningPaths />} />
                  <Route path="/admin/phe-duyet-khoa-hoc" element={<AdminApproveCourses />} />
                  <Route path="/admin/giao-dich" element={<AdminTransactions token={token} />} />
                  <Route path="/admin/rut-tien" element={<AdminWithdrawals token={token} />} />
                  <Route path="/admin/ma-giam-gia" element={<CouponManager token={token} />} />
                  <Route path="/admin/danh-gia" element={<ReviewModeration token={token} />} />
                  <Route path="/admin/thong-bao" element={<NotificationPageWrapper />} />
                  <Route path="/admin/nhat-ky-he-thong" element={<AuditLogViewer />} />
                  <Route path="/admin/loi-chung-thuc" element={<AdminTestimonials />} />
                  <Route path="/admin/ho-so" element={<ProfileSettings />} />
                </Route>
              </Route>

              {/* Teacher Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['teacher']} />}>
                <Route element={<TeacherLayout />}>
                  <Route path="/teacher/dashboard" element={<TeacherDashboardWrapper />} />
                  <Route path="/teacher/course-builder" element={<CourseBuilder />} />
                  <Route path="/teacher/assignments" element={<TeacherAssignmentsPage token={token} />} />
                  <Route path="/teacher/coupons" element={<CouponManager token={token} role="teacher" />} />
                  <Route path="/teacher/transactions" element={<TeacherTransactions token={token} />} />
                  <Route path="/teacher/rut-tien" element={<TeacherWithdrawals token={token} />} />
                  <Route path="/teacher/notifications" element={<NotificationPageWrapper />} />
                  <Route path="/teacher/profile" element={<ProfileSettings />} />
                </Route>
              </Route>

              {/* Student Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['student']} />}>
                <Route element={<StudentLayout />}>
                  <Route path="/student/dashboard" element={<StudentDashboardWrapper />} />
                  <Route path="/courses" element={<StudentCoursesPage token={token} />} />
                  <Route path="/student/roadmaps" element={<StudentRoadmaps />} />
                  <Route path="/student/my-courses" element={<StudentMyLearningPage token={token} />} />
                  <Route path="/student/quizzes" element={<StudentQuizPage token={token} />} />
                  <Route path="/student/assignments" element={<StudentAssignmentsPage token={token} />} />
                  <Route path="/student/certificates" element={<StudentCertificates token={token} />} />
                  <Route path="/student/notifications" element={<NotificationPageWrapper />} />
                  <Route path="/student/payments" element={<PaymentHistory token={token} />} />
                  <Route path="/student/cart" element={<CartPage token={token} />} />
                  <Route path="/student/checkout" element={<CheckoutPage token={token} />} />
                  <Route path="/student/checkout/vnpay-mock" element={<VNPayMockPage token={token} />} />
                  <Route path="/payment-result" element={<PaymentResultPage />} />
                  <Route path="/student/payment-result" element={<PaymentResultPage />} />
                  <Route path="/student/profile" element={<ProfileSettings />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </AuthContext.Provider>
  );
}

// Redirects `/dashboard` to specific sub-dashboard URL based on current role
function DashboardRedirector() {
  const role = useSelector((state) => state.auth.role);
  if (role === 'admin') return <Navigate to="/admin/bang-dieu-khien" replace />;
  if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

// Helper layout board for dashboards
function DashboardLayoutWrapper({ children, title, subtitle, onRefresh, isLoading, error }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 border border-slate-900 p-6 rounded-3xl">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Activity className="w-8 h-8 text-amber-500" />
            <span>{title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          <span className="text-xs text-slate-500">Đang đồng bộ dữ liệu từ cache...</span>
        </div>
      )}

      {!isLoading && children}
    </div>
  );
}

// Sub-dashboards Wrappers
function AdminDashboardWrapper() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const { adminStats, isLoading, error } = useSelector((state) => state.dashboard);

  const refresh = () => dispatch(fetchAdminDashboard(token));

  return (
    <DashboardLayoutWrapper
      title="Bảng Điều Khiển Admin"
      subtitle="Thống kê hệ thống, doanh thu và người dùng."
      onRefresh={refresh}
      isLoading={isLoading}
      error={error}
    >
      {adminStats && <AdminDashboard data={adminStats} />}
    </DashboardLayoutWrapper>
  );
}

function TeacherDashboardWrapper() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const { teacherStats, isLoading, error } = useSelector((state) => state.dashboard);

  const refresh = () => dispatch(fetchTeacherDashboard(token));

  return (
    <DashboardLayoutWrapper
      title="Bảng Điều Khiển Giảng Viên"
      subtitle="Thống kê doanh thu khóa học và hiệu suất học tập của học viên."
      onRefresh={refresh}
      isLoading={isLoading}
      error={error}
    >
      {teacherStats && <TeacherDashboard data={teacherStats} />}
    </DashboardLayoutWrapper>
  );
}

// Student Dashboard Wrapper with Redux Selector
function StudentDashboardWrapper() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { studentStats, isLoading, error } = useSelector((state) => state.dashboard);

  const refresh = () => dispatch(fetchStudentDashboard(token));

  return (
    <DashboardLayoutWrapper
      title="Bảng Học Tập Cá Nhân"
      subtitle="Theo dõi tiến độ học tập và các bài học gần đây của bạn."
      onRefresh={refresh}
      isLoading={isLoading}
      error={error}
    >
      {studentStats && (
        <StudentDashboard
          data={studentStats}
          onStartLearning={(courseId) => {
            navigate(`/student/my-courses?learningCourseId=${courseId}`);
          }}
        />
      )}
    </DashboardLayoutWrapper>
  );
}

// Notification Page Wrapper
function NotificationPageWrapper() {
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  const handleNavigate = (tab) => {
    if (tab === 'my-courses') {
      navigate('/student/my-courses');
    } else if (tab === 'catalog') {
      navigate('/courses');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <NotificationPage
      token={token}
      onNavigate={handleNavigate}
    />
  );
}
