import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchCourseReviews = createAsyncThunk(
  'review/fetchCourseReviews',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/courses/${courseId}/reviews`);
      if (response.data && response.data.success) {
        return {
          reviews: response.data.reviews || [],
          stats: response.data.stats || {
            average_rating: 0,
            total_reviews: 0,
            rating_counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        };
      }
      return rejectWithValue(response.data.message || 'Không thể tải danh sách đánh giá');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi tải đánh giá');
    }
  }
);

export const submitReview = createAsyncThunk(
  'review/submitReview',
  async ({ token, courseId, rating, comment }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/v1/student/reviews/${courseId}`, { rating, comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        dispatch(fetchCourseReviews(courseId)); // Refresh stats & reviews
        return response.data.message;
      }
      return rejectWithValue(response.data.message || 'Gửi đánh giá thất bại');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối khi gửi đánh giá');
    }
  }
);

export const editReview = createAsyncThunk(
  'review/editReview',
  async ({ token, courseId, rating, comment }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/v1/student/reviews/${courseId}`, { rating, comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        dispatch(fetchCourseReviews(courseId)); // Refresh stats & reviews
        return response.data.message;
      }
      return rejectWithValue(response.data.message || 'Cập nhật đánh giá thất bại');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối khi cập nhật đánh giá');
    }
  }
);

export const replyToReview = createAsyncThunk(
  'review/replyToReview',
  async ({ token, reviewId, courseId, reply }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/v1/teacher/reviews/${reviewId}/reply`, { reply }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        if (courseId) {
          dispatch(fetchCourseReviews(courseId)); // Refresh if on details page
        }
        return { reviewId, reply };
      }
      return rejectWithValue(response.data.message || 'Phản hồi đánh giá thất bại');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối khi gửi phản hồi');
    }
  }
);

export const moderateReview = createAsyncThunk(
  'review/moderateReview',
  async ({ token, reviewId, courseId, isHidden }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/v1/admin/reviews/${reviewId}/moderate`, { is_hidden: isHidden }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        if (courseId) {
          dispatch(fetchCourseReviews(courseId)); // Refresh if on details page
        }
        return { reviewId, isHidden };
      }
      return rejectWithValue(response.data.message || 'Kiểm duyệt đánh giá thất bại');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối khi kiểm duyệt');
    }
  }
);

export const fetchAdminReviews = createAsyncThunk(
  'review/fetchAdminReviews',
  async ({ token, page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/admin/reviews', {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return {
          reviews: response.data.reviews || [],
          total: response.data.total || 0,
          page,
          limit
        };
      }
      return rejectWithValue(response.data.message || 'Không thể tải toàn bộ đánh giá');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

const reviewSlice = createSlice({
  name: 'review',
  initialState: {
    reviews: [],
    stats: {
      average_rating: 0,
      total_reviews: 0,
      rating_counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    adminReviewsList: [],
    adminTotalReviews: 0,
    adminCurrentPage: 1,
    adminLimitReviews: 10,
    isLoading: false,
    isActionLoading: false,
    error: null,
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Course Reviews
      .addCase(fetchCourseReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.reviews;
        state.stats = action.payload.stats;
      })
      .addCase(fetchCourseReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Submit Review
      .addCase(submitReview.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.isActionLoading = false;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Edit Review
      .addCase(editReview.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(editReview.fulfilled, (state) => {
        state.isActionLoading = false;
      })
      .addCase(editReview.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Reply to Review
      .addCase(replyToReview.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(replyToReview.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const review = state.reviews.find(r => r.id === action.payload.reviewId);
        if (review) {
          review.reply = action.payload.reply;
          review.replied_at = new Date().toISOString();
        }
        const adminReview = state.adminReviewsList.find(r => r.id === action.payload.reviewId);
        if (adminReview) {
          adminReview.reply = action.payload.reply;
          adminReview.replied_at = new Date().toISOString();
        }
      })
      .addCase(replyToReview.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Moderate Review
      .addCase(moderateReview.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(moderateReview.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const review = state.reviews.find(r => r.id === action.payload.reviewId);
        if (review) {
          review.is_hidden = action.payload.isHidden;
        }
        const adminReview = state.adminReviewsList.find(r => r.id === action.payload.reviewId);
        if (adminReview) {
          adminReview.is_hidden = action.payload.isHidden;
        }
      })
      .addCase(moderateReview.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Fetch Admin Reviews List
      .addCase(fetchAdminReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminReviewsList = action.payload.reviews;
        state.adminTotalReviews = action.payload.total;
        state.adminCurrentPage = action.payload.page;
        state.adminLimitReviews = action.payload.limit;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
