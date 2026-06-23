import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchTenantConfig = createAsyncThunk(
  'tenant/fetchTenantConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/api/v1/tenant');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to load tenant configuration'
      );
    }
  }
);

const initialState = {
  config: null,
  loading: false,
  error: null,
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenantConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenantConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
        
        // Dynamically apply Theme Color and Title
        if (action.payload) {
          document.title = action.payload.name || 'Academy LMS';
          
          // Apply primary color as a CSS variable if a color exists
          if (action.payload.theme_color) {
            document.documentElement.style.setProperty('--primary-brand-color', action.payload.theme_color);
            // You can easily bind `--primary-brand-color` in index.css to tailwind/regular css classes
          }
        }
      })
      .addCase(fetchTenantConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default tenantSlice.reducer;
