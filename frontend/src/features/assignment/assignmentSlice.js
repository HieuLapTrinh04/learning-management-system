import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ─── Async Thunks ────────────────────────────────────────

/** Student: Submit assignment file via multipart upload (Cloudinary) */
export const submitAssignment = createAsyncThunk(
  'assignment/submitAssignment',
  async ({ assignmentId, file, token }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(
        `/api/v1/student/assignments/${assignmentId}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (res.data && res.data.success) return res.data.data;
      return rejectWithValue(res.data?.message || 'Nộp bài thất bại.');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi tải lên.');
    }
  }
);

export const fetchMySubmission = createAsyncThunk(
  'assignment/fetchMySubmission',
  async ({ assignmentId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `/api/v1/student/assignments/${assignmentId}/my-submission`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.success) return res.data.data;
      return rejectWithValue('Không thể tải bài nộp.');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi.');
    }
  }
);

/** Teacher: List submissions for an assignment */
export const fetchSubmissions = createAsyncThunk(
  'assignment/fetchSubmissions',
  async ({ assignmentId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `/api/v1/teacher/assignments/${assignmentId}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.success) return res.data.data;
      return rejectWithValue(res.data?.message || 'Không thể tải danh sách.');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi.');
    }
  }
);

/** Teacher: Grade a submission */
export const gradeSubmission = createAsyncThunk(
  'assignment/gradeSubmission',
  async ({ submissionId, score, feedback, token }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `/api/v1/teacher/submissions/${submissionId}/grade`,
        { score, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.success) return res.data.data;
      return rejectWithValue(res.data?.message || 'Chấm điểm thất bại.');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi.');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────

const initialState = {
  // Student upload
  uploadPhase: 'idle', // idle | uploading | success | error
  uploadedSubmission: null,
  uploadError: null,

  // Teacher submissions list
  submissions: [],
  submissionsPhase: 'idle', // idle | loading | loaded | error
  submissionsError: null,

  // Teacher grading
  gradingPhase: 'idle', // idle | grading | success | error
  gradingError: null,
};

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    resetUpload(state) {
      state.uploadPhase = 'idle';
      state.uploadedSubmission = null;
      state.uploadError = null;
    },
    resetGrading(state) {
      state.gradingPhase = 'idle';
      state.gradingError = null;
    },
    resetAll() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Submit
    builder
      .addCase(submitAssignment.pending, (state) => {
        state.uploadPhase = 'uploading';
        state.uploadError = null;
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.uploadPhase = 'success';
        state.uploadedSubmission = action.payload;
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.uploadPhase = 'error';
        state.uploadError = action.payload;
      })
      // fetchMySubmission
      .addCase(fetchMySubmission.pending, (state) => {
        state.uploadPhase = 'loading';
        state.uploadError = null;
      })
      .addCase(fetchMySubmission.fulfilled, (state, action) => {
        state.uploadPhase = action.payload ? 'success' : 'idle';
        state.uploadedSubmission = action.payload;
      })
      .addCase(fetchMySubmission.rejected, (state, action) => {
        state.uploadPhase = 'error';
        state.uploadError = action.payload;
      })
      // Fetch submissions
      .addCase(fetchSubmissions.pending, (state) => {
        state.submissionsPhase = 'loading';
        state.submissionsError = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissionsPhase = 'loaded';
        state.submissions = action.payload || [];
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.submissionsPhase = 'error';
        state.submissionsError = action.payload;
      });
    // Grade
    builder
      .addCase(gradeSubmission.pending, (state) => {
        state.gradingPhase = 'grading';
        state.gradingError = null;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.gradingPhase = 'success';
        // Update submission in list
        const idx = state.submissions.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.submissions[idx] = action.payload;
      })
      .addCase(gradeSubmission.rejected, (state, action) => {
        state.gradingPhase = 'error';
        state.gradingError = action.payload;
      });
  },
});

export const { resetUpload, resetGrading, resetAll } = assignmentSlice.actions;
export default assignmentSlice.reducer;
