import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchPaymentHistory',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/student/payments/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.orders;
      }
      return rejectWithValue(response.data.message || 'Không thể tải lịch sử thanh toán');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ');
    }
  }
);

export const fetchAdminTransactions = createAsyncThunk(
  'payment/fetchAdminTransactions',
  async ({ token, page = 1, limit = 10, status = '', search = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/admin/payments/transactions`, {
        params: { page, limit, status, search },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return {
          transactions: response.data.transactions,
          total: response.data.total
        };
      }
      return rejectWithValue(response.data.message || 'Không thể tải danh sách giao dịch');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

export const exportTransactionsCSV = createAsyncThunk(
  'payment/exportTransactionsCSV',
  async ({ token, status = '', search = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/admin/payments/export`, {
        params: { status, search },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important to handle file download
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      return true;
    } catch (err) {
      return rejectWithValue('Không thể xuất file CSV');
    }
  }
);

export const fetchTeacherTransactions = createAsyncThunk(
  'payment/fetchTeacherTransactions',
  async ({ token, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/teacher/transactions`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return {
          transactions: response.data.transactions,
          total: response.data.total
        };
      }
      return rejectWithValue(response.data.message || 'Không thể tải danh sách giao dịch');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

export const refundOrder = createAsyncThunk(
  'payment/refundOrder',
  async ({ token, orderId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/v1/admin/payments/orders/${orderId}/refund`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return { orderId, message: response.data.message };
      }
      return rejectWithValue(response.data.message || 'Hoàn tiền không thành công');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    history: [],
    transactions: [],
    totalTransactions: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Student History
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload || [];
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Admin Transactions
      .addCase(fetchAdminTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions || [];
        state.totalTransactions = action.payload.total || 0;
      })
      .addCase(fetchAdminTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Teacher Transactions
      .addCase(fetchTeacherTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions || [];
        state.totalTransactions = action.payload.total || 0;
      })
      .addCase(fetchTeacherTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Refund Order
      .addCase(refundOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refundOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedIdx = state.transactions.findIndex(t => t.id === action.payload.orderId);
        if (updatedIdx !== -1) {
          state.transactions[updatedIdx].status = 'refunded';
        }
      })
      .addCase(refundOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;
