import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTeacherBalance = createAsyncThunk(
  'withdrawal/fetchTeacherBalance',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/teacher/withdrawals/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải số dư');
    }
  }
);

export const fetchTeacherWithdrawals = createAsyncThunk(
  'withdrawal/fetchTeacherWithdrawals',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/teacher/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách rút tiền');
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'withdrawal/requestWithdrawal',
  async ({ token, amount, bankName, bankAccount, accountName }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/teacher/withdrawals', 
        { amount: Number(amount), bank_name: bankName, bank_account: bankAccount, account_name: accountName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi gửi yêu cầu rút tiền');
    }
  }
);

export const fetchAdminWithdrawals = createAsyncThunk(
  'withdrawal/fetchAdminWithdrawals',
  async ({ token, status = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/admin/withdrawals', {
        params: { status },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tải danh sách rút tiền');
    }
  }
);

export const updateWithdrawalStatus = createAsyncThunk(
  'withdrawal/updateWithdrawalStatus',
  async ({ token, id, status, adminNote = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/v1/admin/withdrawals/${id}/status`, 
        { status, admin_note: adminNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { id, status, adminNote, message: response.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  }
);

const withdrawalSlice = createSlice({
  name: 'withdrawal',
  initialState: {
    balance: { total_revenue: 0, total_withdrawn: 0, available: 0 },
    withdrawals: [],
    isLoading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearWithdrawalError: (state) => {
      state.error = null;
    },
    clearWithdrawalSuccess: (state) => {
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Balance
      .addCase(fetchTeacherBalance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTeacherBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchTeacherBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Teacher List
      .addCase(fetchTeacherWithdrawals.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTeacherWithdrawals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.withdrawals = action.payload || [];
      })
      .addCase(fetchTeacherWithdrawals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Request
      .addCase(requestWithdrawal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = 'Gửi yêu cầu rút tiền thành công!';
        state.withdrawals.unshift(action.payload); // Add to top
        // Deduct available
        state.balance.available -= action.payload.amount;
        state.balance.total_withdrawn += action.payload.amount;
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Admin List
      .addCase(fetchAdminWithdrawals.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminWithdrawals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.withdrawals = action.payload || [];
      })
      .addCase(fetchAdminWithdrawals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Admin Update
      .addCase(updateWithdrawalStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWithdrawalStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = 'Cập nhật trạng thái thành công!';
        const index = state.withdrawals.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.withdrawals[index].status = action.payload.status;
          state.withdrawals[index].admin_note = action.payload.adminNote;
        }
      })
      .addCase(updateWithdrawalStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearWithdrawalError, clearWithdrawalSuccess } = withdrawalSlice.actions;
export default withdrawalSlice.reducer;
