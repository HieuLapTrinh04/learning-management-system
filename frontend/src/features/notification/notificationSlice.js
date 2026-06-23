import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      return rejectWithValue(response.data.message || 'Không thể lấy danh sách thông báo');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu thông báo');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return id;
      }
      return rejectWithValue(response.data.message || 'Không thể đánh dấu đã đọc');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return true;
      }
      return rejectWithValue(response.data.message || 'Không thể đánh dấu tất cả đã đọc');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    wsConnected: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = action.payload;
      // Tránh trùng lặp nếu trùng ID
      const exists = state.notifications.some(n => n.id === notification.id);
      if (!exists) {
        state.notifications.unshift(notification);
        if (!notification.is_read) {
          state.unreadCount += 1;
        }
      }
    },
    setWsConnected: (state, action) => {
      state.wsConnected = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.wsConnected = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // markAsRead
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        state.notifications = state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        );
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      // markAllAsRead
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, is_read: true }));
        state.unreadCount = 0;
      });
  }
});

export const { addNotification, setWsConnected, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
