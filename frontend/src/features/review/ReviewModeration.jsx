import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  Search, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Clock, 
  User 
} from 'lucide-react';
import { fetchAdminReviews, moderateReview } from './reviewSlice';

export default function ReviewModeration({ token }) {
  const dispatch = useDispatch();
  const { 
    adminReviewsList, 
    adminTotalReviews, 
    adminCurrentPage, 
    adminLimitReviews, 
    isLoading, 
    isActionLoading, 
    error 
  } = useSelector((state) => state.review);

  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    if (token) {
      dispatch(fetchAdminReviews({ token, page: adminCurrentPage, search: searchVal }));
    }
  }, [dispatch, token, adminCurrentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchAdminReviews({ token, page: 1, search: searchVal }));
  };

  const handlePageChange = (page) => {
    dispatch(fetchAdminReviews({ token, page, search: searchVal }));
  };

  const handleModerateToggle = async (reviewId, isCurrentlyHidden) => {
    const actionText = isCurrentlyHidden ? 'hiển thị lại' : 'ẩn đi';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} đánh giá này?`)) {
      return;
    }

    try {
      await dispatch(moderateReview({ 
        token, 
        reviewId, 
        isHidden: !isCurrentlyHidden 
      })).unwrap();
      
      alert(`Đã ${actionText} đánh giá thành công!`);
    } catch (err) {
      alert(err || 'Có lỗi xảy ra khi kiểm duyệt đánh giá.');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title Board */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-900/20 border border-slate-900 p-4 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2 sm:gap-3">
            <Star className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500 fill-amber-500" />
            <span>Kiểm Duyệt Đánh Giá</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-normal">Quản lý và kiểm duyệt các đánh giá của học viên trên toàn hệ thống khóa học.</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-slate-900/30 border border-slate-900 p-3 sm:p-5 rounded-3xl flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center text-slate-500">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm kiếm theo nội dung bình luận..."
            className="block w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-2 sm:py-2.5 bg-[#0c101a] border border-slate-850 focus:border-amber-500/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none text-[10px] sm:text-xs transition"
          />
          <button 
            type="submit" 
            className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 px-2 sm:px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[9px] sm:text-[10px] font-bold rounded-lg border border-slate-800"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
          Tổng số đánh giá: <span className="text-amber-500 font-mono font-black">{adminTotalReviews}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex gap-3 max-w-2xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && adminReviewsList.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin animate-spin-slow" />
          <span className="text-xs text-slate-500 font-semibold">Đang tải danh sách kiểm duyệt đánh giá...</span>
        </div>
      ) : adminReviewsList.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-900 rounded-3xl bg-slate-950/10">
          Chưa tìm thấy đánh giá nào trên hệ thống phù hợp với từ khóa.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/40">
            <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-max">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 text-[9px] sm:text-[10px] uppercase font-mono tracking-wider">
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Người đánh giá</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Khóa học</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Số sao</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Nội dung</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Phản hồi</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Ngày tạo</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold">Trạng thái</th>
                  <th className="px-2 py-1.5 sm:p-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900/60">
                {adminReviewsList.map((review) => {
                  const studentName = review.student?.name || 'Học viên LMS';
                  const studentEmail = review.student?.email || 'N/A';
                  const initials = studentName[0] || 'H';
                  const courseTitle = review.Course?.title || 'Khóa học không tồn tại';

                  return (
                    <tr key={review.id} className="hover:bg-slate-900/10 transition">
                      <td className="px-2 py-1.5 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-bold text-[9px] sm:text-xs">
                            {initials}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-200 text-[10px] sm:text-xs">{studentName}</span>
                            <span className="block text-[8px] sm:text-[10px] text-slate-500 mt-0.5">{studentEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[120px] max-w-[120px] sm:min-w-[200px] sm:max-w-[200px]">
                        <span className="font-semibold text-slate-300 line-clamp-2 leading-relaxed text-[10px] sm:text-xs">
                          {courseTitle}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 scale-75 origin-left sm:scale-100 min-w-[70px]">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[160px] max-w-[160px] sm:min-w-[250px] sm:max-w-[250px]">
                        <span className="text-slate-350 line-clamp-2 leading-relaxed text-[10px] sm:text-xs">
                          {review.comment}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 min-w-[150px] max-w-[150px] sm:min-w-[200px] sm:max-w-[200px]">
                        {review.reply ? (
                          <div className="flex items-start gap-1 sm:gap-1.5 text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg">
                            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2 text-[9px] sm:text-[11px] leading-relaxed">{review.reply}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic text-[9px] sm:text-[11px]">Chưa phản hồi</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 text-slate-400">
                        <div className="flex items-center gap-1 text-[9px] sm:text-xs">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                          <span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 sm:p-4">
                        {review.is_hidden ? (
                          <span className="text-[8px] sm:text-[10px] uppercase font-bold text-red-500 bg-red-950/15 border border-red-900/30 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full whitespace-nowrap">
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="text-[8px] sm:text-[10px] uppercase font-bold text-emerald-500 bg-emerald-950/15 border border-emerald-900/30 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full whitespace-nowrap">
                            Hiển thị
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:p-4 text-right">
                        <button
                          onClick={() => handleModerateToggle(review.id, review.is_hidden)}
                          disabled={isActionLoading}
                          className={`py-1 px-1.5 sm:py-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-bold border transition whitespace-nowrap ${
                            review.is_hidden
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                          }`}
                        >
                          {review.is_hidden ? 'Hiển thị' : 'Ẩn đi'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {adminTotalReviews > adminLimitReviews && (
            <div className="flex justify-between items-center text-xs pt-3">
              <button 
                onClick={() => handlePageChange(adminCurrentPage - 1)}
                disabled={adminCurrentPage === 1 || isLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-350 font-bold rounded-lg border border-slate-800 transition"
              >
                Trước
              </button>
              <span className="text-slate-555 font-semibold">Trang <span className="text-amber-500 font-bold font-mono">{adminCurrentPage}</span> / {Math.ceil(adminTotalReviews / adminLimitReviews)}</span>
              <button 
                onClick={() => handlePageChange(adminCurrentPage + 1)}
                disabled={adminCurrentPage >= Math.ceil(adminTotalReviews / adminLimitReviews) || isLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-355 font-bold rounded-lg border border-slate-800 transition"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
