import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchAdminDashboard = createAsyncThunk(
  'dashboard/fetchAdminDashboard',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/admin/dashboard/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Không thể tải phân tích quản trị');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

export const fetchTeacherDashboard = createAsyncThunk(
  'dashboard/fetchTeacherDashboard',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/teacher/dashboard/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Không thể tải phân tích giảng viên');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

export const fetchStudentDashboard = createAsyncThunk(
  'dashboard/fetchStudentDashboard',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/student/dashboard/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Không thể tải phân tích học sinh');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    adminStats: null,
    teacherStats: null,
    studentStats: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Admin
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminStats = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Teacher
      .addCase(fetchTeacherDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teacherStats = action.payload;
      })
      .addCase(fetchTeacherDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Student
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentStats = action.payload;
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
