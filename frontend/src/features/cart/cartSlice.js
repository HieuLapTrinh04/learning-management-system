import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/student/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return {
          items: response.data.items || [],
          totalPrice: response.data.total_price || 0
        };
      }
      return rejectWithValue(response.data.message || 'Không thể tải giỏ hàng');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối đến máy chủ');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ token, courseId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/student/cart', {
        course_id: Number(courseId)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        dispatch(fetchCart(token)); // Refresh cart items and total price automatically
        return response.data.message || 'Đã thêm khóa học vào giỏ hàng';
      }
      return rejectWithValue(response.data.message || 'Không thể thêm vào giỏ hàng');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ token, courseId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/v1/student/cart/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        dispatch(fetchCart(token)); // Refresh cart items and total price automatically
        return { courseId, message: response.data.message };
      }
      return rejectWithValue(response.data.message || 'Không thể xóa khỏi giỏ hàng');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi xóa khỏi giỏ hàng');
    }
  }
);

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async ({ token, code }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/student/cart/coupon', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return {
          coupon: response.data.coupon,
          discountAmount: response.data.discount_amount
        };
      }
      return rejectWithValue(response.data.message || 'Mã giảm giá không hợp lệ');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi áp dụng mã giảm giá');
    }
  }
);

export const checkoutCart = createAsyncThunk(
  'cart/checkoutCart',
  async ({ token, couponCode }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/student/cart/checkout', {
        coupon_code: couponCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success && response.data.payment_url) {
        return response.data.payment_url;
      }
      return rejectWithValue(response.data.message || 'Thanh toán giỏ hàng thất bại');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình thanh toán');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalPrice: 0,
    appliedCoupon: null,
    discountAmount: 0,
    isLoading: false,
    isCartActionLoading: false, // separate loading for fast cart mutations
    error: null,
    checkoutUrl: null,
  },
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
    },
    resetCheckoutUrl: (state) => {
      state.checkoutUrl = null;
    },
    clearCartState: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.appliedCoupon = null;
      state.discountAmount = 0;
      state.checkoutUrl = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.totalPrice = action.payload.totalPrice;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isCartActionLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state) => {
        state.isCartActionLoading = false;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isCartActionLoading = false;
        state.error = action.payload;
      })

      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.isCartActionLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state) => {
        state.isCartActionLoading = false;
        // If the removed course was applied with a coupon, clear it to avoid discount discrepancies
        state.appliedCoupon = null;
        state.discountAmount = 0;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isCartActionLoading = false;
        state.error = action.payload;
      })

      // Apply Coupon
      .addCase(applyCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appliedCoupon = action.payload.coupon;
        state.discountAmount = action.payload.discountAmount;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.appliedCoupon = null;
        state.discountAmount = 0;
      })

      // Checkout Cart
      .addCase(checkoutCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkoutCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkoutUrl = action.payload;
      })
      .addCase(checkoutCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCartError, clearAppliedCoupon, resetCheckoutUrl, clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
