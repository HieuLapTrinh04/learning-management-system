import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchCoupons = createAsyncThunk(
  'coupon/fetchCoupons',
  async ({ token, page = 1, limit = 10, search = '', role = 'admin' }, { rejectWithValue }) => {
    try {
      const endpoint = role === 'teacher' ? '/api/v1/teacher/coupons' : '/api/v1/admin/coupons';
      const response = await axios.get(endpoint, {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return {
          coupons: response.data.coupons || [],
          total: response.data.total || 0,
          page,
          limit
        };
      }
      return rejectWithValue(response.data.message || 'Không thể tải danh sách mã giảm giá');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
    }
  }
);

export const createCoupon = createAsyncThunk(
  'coupon/createCoupon',
  async ({ token, coupon, role = 'admin' }, { rejectWithValue }) => {
    try {
      const endpoint = role === 'teacher' ? '/api/v1/teacher/coupons' : '/api/v1/admin/coupons';
      const response = await axios.post(endpoint, coupon, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Tạo mã giảm giá thất bại');
    } catch (err) {
      if (err.response?.data?.error?.message) return rejectWithValue(err.response.data.error.message);
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi tạo mã giảm giá');
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'coupon/updateCoupon',
  async ({ token, id, coupon, role = 'admin' }, { rejectWithValue }) => {
    try {
      const endpoint = role === 'teacher' ? `/api/v1/teacher/coupons/${id}` : `/api/v1/admin/coupons/${id}`;
      const response = await axios.put(endpoint, coupon, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return { id, coupon };
      }
      return rejectWithValue(response.data.message || 'Cập nhật mã giảm giá thất bại');
    } catch (err) {
      if (err.response?.data?.error?.message) return rejectWithValue(err.response.data.error.message);
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật mã giảm giá');
    }
  }
);

export const toggleCouponStatus = createAsyncThunk(
  'coupon/toggleCouponStatus',
  async ({ token, id, isActive, role = 'admin' }, { rejectWithValue }) => {
    try {
      const endpoint = role === 'teacher' ? `/api/v1/teacher/coupons/${id}/status` : `/api/v1/admin/coupons/${id}/status`;
      const response = await axios.put(endpoint, { is_active: isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return { id, isActive };
      }
      return rejectWithValue(response.data.message || 'Cập nhật trạng thái thất bại');
    } catch (err) {
      if (err.response?.data?.error?.message) return rejectWithValue(err.response.data.error.message);
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  }
);

export const expireCoupon = createAsyncThunk(
  'coupon/expireCoupon',
  async ({ token, id, role = 'admin' }, { rejectWithValue }) => {
    try {
      const endpoint = role === 'teacher' ? `/api/v1/teacher/coupons/${id}/expire` : `/api/v1/admin/coupons/${id}/expire`;
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return { id };
      }
      return rejectWithValue(response.data.message || 'Thiết lập hết hạn thất bại');
    } catch (err) {
      if (err.response?.data?.error?.message) return rejectWithValue(err.response.data.error.message);
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi thiết lập hết hạn');
    }
  }
);

const couponSlice = createSlice({
  name: 'coupon',
  initialState: {
    coupons: [],
    totalCoupons: 0,
    currentPage: 1,
    limitCoupons: 10,
    isLoading: false,
    isActionLoading: false,
    error: null,
  },
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coupons = action.payload.coupons;
        state.totalCoupons = action.payload.total;
        state.currentPage = action.payload.page;
        state.limitCoupons = action.payload.limit;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Coupon
      .addCase(createCoupon.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.coupons.unshift(action.payload); // Add new coupon to the top of list
        state.totalCoupons += 1;
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Update Coupon
      .addCase(updateCoupon.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const index = state.coupons.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.coupons[index] = { ...state.coupons[index], ...action.payload.coupon };
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Toggle Status
      .addCase(toggleCouponStatus.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const coupon = state.coupons.find(c => c.id === action.payload.id);
        if (coupon) {
          coupon.is_active = action.payload.isActive;
        }
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      })

      // Expire Coupon
      .addCase(expireCoupon.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
      })
      .addCase(expireCoupon.fulfilled, (state, action) => {
        state.isActionLoading = false;
        const coupon = state.coupons.find(c => c.id === action.payload.id);
        if (coupon) {
          coupon.is_active = false;
          coupon.expiry_date = new Date().toISOString();
        }
      })
      .addCase(expireCoupon.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;
