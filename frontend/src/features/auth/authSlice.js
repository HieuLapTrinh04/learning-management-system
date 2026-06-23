import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';
import axios from 'axios';

// Decode JWT helper on the client side
export function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Helper to determine userName based on email and role
export function parseUserNameFromEmail(email, role) {
  if (!email) return 'User';
  if (email === 'admin@lms.edu.vn') return 'Quản trị viên';
  if (email === 'teacher@lms.edu.vn') return 'Giảng viên';
  if (email === 'student@lms.edu.vn') return 'Học viên';
  
  const prefix = email.split('@')[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

// Initial state reading from localStorage to maintain active session across tab refreshes
const initialState = {
  token: localStorage.getItem('lms_token') || null,
  role: localStorage.getItem('lms_role') || null,
  userId: localStorage.getItem('lms_user_id') || null,
  userName: localStorage.getItem('lms_user_name') || null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Login Async Thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/api/v1/auth/login', { email, password });
      if (response.data.success) {
        const token = response.data.data.access_token;
        const decoded = decodeJwt(token);
        
        if (!decoded) throw new Error('JWT token invalid claims structure');

        const role = decoded.role;
        const userId = decoded.user_id;
        const userName = parseUserNameFromEmail(email, role);

        // Save session details to local storage
        localStorage.setItem('lms_token', token);
        localStorage.setItem('lms_role', role);
        localStorage.setItem('lms_user_id', userId);
        localStorage.setItem('lms_user_name', userName);

        return { token, role, userId, userName };
      } else {
        return rejectWithValue(response.data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        return rejectWithValue(err.response.data.error);
      }
      return rejectWithValue(err.message || 'Lỗi kết nối máy chủ');
    }
  }
);

// Sandbox Quick Login Async Thunk
export const loginSandbox = createAsyncThunk(
  'auth/loginSandbox',
  async (selectedRole, { rejectWithValue }) => {
    try {
      let testEmail = '';
      if (selectedRole === 'admin') testEmail = 'admin@lms.edu.vn';
      else if (selectedRole === 'teacher') testEmail = 'teacher@lms.edu.vn';
      else testEmail = 'student@lms.edu.vn';

      const testPassword = 'securepassword123';
      const response = await axiosClient.post('/api/v1/auth/login', {
        email: testEmail,
        password: testPassword,
      });

      if (response.data.success) {
        const token = response.data.data.access_token;
        const decoded = decodeJwt(token);
        
        if (!decoded) throw new Error('JWT token invalid claims structure');

        const role = decoded.role;
        const userId = decoded.user_id;
        const userName = parseUserNameFromEmail(testEmail, role);

        localStorage.setItem('lms_token', token);
        localStorage.setItem('lms_role', role);
        localStorage.setItem('lms_user_id', userId);
        localStorage.setItem('lms_user_name', userName);

        return { token, role, userId, userName };
      } else {
        return rejectWithValue(response.data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        return rejectWithValue(err.response.data.error);
      }
      return rejectWithValue('Không thể kết nối. Hãy đảm bảo backend service đang hoạt động.');
    }
  }
);

// Register Async Thunk
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/api/v1/auth/register', {
        name,
        email,
        password,
        role,
      });
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message || 'Registration failed');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        return rejectWithValue(err.response.data.error);
      }
      return rejectWithValue(err.message || 'Lỗi kết nối đăng ký');
    }
  }
);

// Logout Async Thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      // Request log out with axiosClient to automatically append Bearer token
      await axiosClient.post('/api/v1/auth/logout');
    } catch (err) {
      // In case session already ended on backend, continue cleaning up local storage anyway
      console.warn('Backend logout failed or session already killed:', err);
    } finally {
      // Clean up localStorage details
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_role');
      localStorage.removeItem('lms_user_id');
      localStorage.removeItem('lms_user_name');
    }
  }
);

// Refresh Token Async Thunk (Used to fetch rotated tokens)
export const refreshUserToken = createAsyncThunk(
  'auth/refreshUserToken',
  async (_, { rejectWithValue }) => {
    try {
      // Direct call to avoid auth interceptor recursion loop
      const response = await axios.post('/api/v1/auth/refresh', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.success) {
        const token = response.data.data.access_token;
        const decoded = decodeJwt(token);
        
        if (!decoded) throw new Error('JWT token invalid claims structure');

        const role = decoded.role;
        const userId = decoded.user_id;
        
        // Fetch current userName or compute fallback
        const currentName = localStorage.getItem('lms_user_name') || 'User';

        localStorage.setItem('lms_token', token);
        localStorage.setItem('lms_role', role);
        localStorage.setItem('lms_user_id', userId);

        return { token, role, userId, userName: currentName };
      } else {
        return rejectWithValue('Refresh validation failed');
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous action to restore session from state
    initializeAuth: (state) => {
      const token = localStorage.getItem('lms_token');
      const role = localStorage.getItem('lms_role');
      const userId = localStorage.getItem('lms_user_id');
      const userName = localStorage.getItem('lms_user_name');

      if (token && role && userId) {
        state.token = token;
        state.role = role;
        state.userId = userId;
        state.userName = userName;
        state.status = 'succeeded';
      }
    },
    // Synchronous trigger for force refresh updates via Custom Events
    updateAccessToken: (state, action) => {
      const token = action.payload;
      const decoded = decodeJwt(token);
      if (decoded) {
        state.token = token;
        state.role = decoded.role;
        state.userId = decoded.user_id;
        state.status = 'succeeded';
      }
    },
    // Clean states in memory immediately
    clearAuthSession: (state) => {
      state.token = null;
      state.role = null;
      state.userId = null;
      state.userName = null;
      state.status = 'idle';
      state.error = null;
    },
    updateUserName: (state, action) => {
      state.userName = action.payload;
      localStorage.setItem('lms_user_name', action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.userName = action.payload.userName;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Sandbox Login
      .addCase(loginSandbox.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginSandbox.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.userName = action.payload.userName;
      })
      .addCase(loginSandbox.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.role = null;
        state.userId = null;
        state.userName = null;
        state.status = 'idle';
        state.error = null;
      })

      // Refresh Token
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.userName = action.payload.userName;
      })
      .addCase(refreshUserToken.rejected, (state) => {
        state.token = null;
        state.role = null;
        state.userId = null;
        state.userName = null;
        state.status = 'idle';
      });
  }
});

export const { initializeAuth, updateAccessToken, clearAuthSession, updateUserName } = authSlice.actions;
export default authSlice.reducer;
