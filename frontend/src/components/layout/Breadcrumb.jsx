import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const segmentTranslations = {
  admin: 'Quản trị viên',
  teacher: 'Giảng viên',
  student: 'Học viên',
  dashboard: 'Bảng điều khiển',
  'bang-dieu-khien': 'Bảng điều khiển',
  analytics: 'Thống kê & Phân tích',
  courses: 'Danh mục khóa học',
  'my-courses': 'Khóa học của tôi',
  'course-builder': 'Quản lý khóa học',
  quizzes: 'Bài kiểm tra',
  assignments: 'Bài tập',
  submissions: 'Bài nộp',
  notifications: 'Thông báo',
  'thong-bao': 'Thông báo',
  certificates: 'Chứng chỉ',
  verify: 'Xác thực',
  payments: 'Lịch sử giao dịch',
  cart: 'Giỏ hàng',
  checkout: 'Thanh toán',
  'vnpay-mock': 'Cổng VNPay',
  'payment-result': 'Kết quả thanh toán',
  categories: 'Chuyên mục',
  'danh-muc': 'Chuyên mục',
  'approve-courses': 'Duyệt khóa học',
  'phe-duyet-khoa-hoc': 'Duyệt khóa học',
  transactions: 'Quản lý giao dịch',
  'giao-dich': 'Quản lý giao dịch',
  coupons: 'Mã giảm giá',
  'ma-giam-gia': 'Mã giảm giá',
  reviews: 'Đánh giá & Nhận xét',
  'danh-gia': 'Đánh giá & Nhận xét',
  'audit-logs': 'Nhật ký hệ thống',
  'nhat-ky-he-thong': 'Nhật ký hệ thống',
  profile: 'Hồ sơ cá nhân',
  'ho-so': 'Hồ sơ cá nhân',
  testimonials: 'Cảm nhận học viên',
  'loi-chung-thuc': 'Cảm nhận học viên',
  users: 'Người dùng',
  'quan-ly-nguoi-dung': 'Quản lý người dùng',
  roadmaps: 'Lộ trình học tập',
  withdrawals: 'Rút tiền',
  'rut-tien': 'Duyệt & Rút tiền',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2.5">
        
        {/* Home Link */}
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-amber-500 transition duration-150"
          >
            <Home className="mr-2 h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Translate dynamic parameters like numeric IDs as raw values
          const isNumericId = !isNaN(Number(value));
          const displayName = isNumericId 
            ? `#${value}` 
            : (segmentTranslations[value] || value.charAt(0).toUpperCase() + value.slice(1));

          return (
            <li key={to} className="inline-flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-slate-700 mx-1" />
              
              {last ? (
                <span className="text-xs font-semibold text-amber-500 tracking-wide font-serif">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-xs font-medium text-slate-500 hover:text-slate-300 transition duration-150"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
