import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchMyCertificates = createAsyncThunk(
  'certificate/fetchMyCertificates',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/v1/student/certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Không thể tải chứng chỉ');
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || err.response?.data?.message || 'Lỗi kết nối máy chủ');
    }
  }
);

export const generateCertificate = createAsyncThunk(
  'certificate/generateCertificate',
  async ({ courseId, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/v1/student/enrollments/${courseId}/certificate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Cấp chứng chỉ thất bại');
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu cấp chứng chỉ');
    }
  }
);

export const verifyCertificate = createAsyncThunk(
  'certificate/verifyCertificate',
  async (code, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/v1/certificates/verify/${code}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message || 'Mã chứng chỉ không hợp lệ');
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || err.response?.data?.message || 'Chứng chỉ không tồn tại hoặc mã xác thực không hợp lệ');
    }
  }
);

const certificateSlice = createSlice({
  name: 'certificate',
  initialState: {
    certificates: [],
    verifiedCert: null,
    isLoading: false,
    isGenerating: false,
    isVerifying: false,
    error: null,
    verifyError: null,
  },
  reducers: {
    clearCertificateErrors: (state) => {
      state.error = null;
      state.verifyError = null;
    },
    clearVerifiedCertificate: (state) => {
      state.verifiedCert = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch certificates
      .addCase(fetchMyCertificates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyCertificates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.certificates = action.payload || [];
      })
      .addCase(fetchMyCertificates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Generate certificate
      .addCase(generateCertificate.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateCertificate.fulfilled, (state, action) => {
        state.isGenerating = false;
        // Append generated certificate to list if not present
        const exists = state.certificates.some(c => c.id === action.payload.id);
        if (!exists) {
          state.certificates.push(action.payload);
        }
      })
      .addCase(generateCertificate.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
      })
      // Verify certificate
      .addCase(verifyCertificate.pending, (state) => {
        state.isVerifying = true;
        state.verifyError = null;
        state.verifiedCert = null;
      })
      .addCase(verifyCertificate.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.verifiedCert = action.payload;
      })
      .addCase(verifyCertificate.rejected, (state, action) => {
        state.isVerifying = false;
        state.verifyError = action.payload;
      });
  }
});

export const { clearCertificateErrors, clearVerifiedCertificate } = certificateSlice.actions;
export default certificateSlice.reducer;
