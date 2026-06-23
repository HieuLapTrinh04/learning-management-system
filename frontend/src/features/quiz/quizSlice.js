import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ─── Async Thunks ────────────────────────────────────────

/** Fetch quiz data (questions + answers, no correct flags) */
export const fetchQuiz = createAsyncThunk(
  'quiz/fetchQuiz',
  async ({ quizId, token }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/v1/student/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.success) {
        return res.data.data; // Quiz object with questions[]->answers[]
      }
      return rejectWithValue(res.data?.message || 'Không thể tải bài kiểm tra.');
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Lỗi kết nối khi tải quiz.'
      );
    }
  }
);

/** Submit quiz attempt */
export const submitQuiz = createAsyncThunk(
  'quiz/submitQuiz',
  async ({ quizId, submissions, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `/api/v1/student/quizzes/${quizId}/submit`,
        { answers: submissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data && res.data.success) {
        return res.data.data; // QuizAttempt { score, is_passed, ... }
      }
      return rejectWithValue(res.data?.message || 'Nộp bài thất bại.');
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Lỗi kết nối khi nộp bài.'
      );
    }
  }
);

// ─── Initial State ───────────────────────────────────────

const initialState = {
  // Quiz data
  quiz: null,
  questions: [],

  // UI phase: 'idle' | 'loading' | 'ready' | 'inProgress' | 'submitting' | 'result'
  phase: 'idle',

  // Student answers: { [questionId]: [answerId, ...] }
  selectedAnswers: {},

  // Timer
  timeRemaining: 0, // seconds
  timerDuration: 0,  // original total seconds

  // Result
  attempt: null,

  // Error
  error: null,
};

// ─── Slice ───────────────────────────────────────────────

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    /** Reset entire quiz state */
    resetQuiz(state) {
      Object.assign(state, initialState);
    },

    /** Start the quiz — transition from 'ready' to 'inProgress' */
    startQuiz(state, action) {
      state.phase = 'inProgress';
      const minutes = action.payload?.minutes || 10;
      state.timerDuration = minutes * 60;
      state.timeRemaining = minutes * 60;
    },

    /** Tick timer down by 1 second */
    tickTimer(state) {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },

    /** Select/toggle an answer for a question */
    selectAnswer(state, action) {
      const { questionId, answerId, isMultiple } = action.payload;
      if (isMultiple) {
        // Toggle in array
        const current = state.selectedAnswers[questionId] || [];
        if (current.includes(answerId)) {
          state.selectedAnswers[questionId] = current.filter(id => id !== answerId);
        } else {
          state.selectedAnswers[questionId] = [...current, answerId];
        }
      } else {
        // Single choice — replace
        state.selectedAnswers[questionId] = [answerId];
      }
    },

    /** Navigate to result screen with provided attempt data */
    showResult(state, action) {
      state.phase = 'result';
      state.attempt = action.payload;
    },
  },

  extraReducers: (builder) => {
    // fetchQuiz
    builder
      .addCase(fetchQuiz.pending, (state) => {
        state.phase = 'loading';
        state.error = null;
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.quiz = action.payload;
        state.questions = action.payload.questions || [];
        state.phase = 'ready';
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.phase = 'idle';
        state.error = action.payload || 'Lỗi không xác định.';
      });

    // submitQuiz
    builder
      .addCase(submitQuiz.pending, (state) => {
        state.phase = 'submitting';
        state.error = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.attempt = action.payload;
        state.phase = 'result';
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.phase = 'inProgress'; // let student retry
        state.error = action.payload || 'Nộp bài thất bại.';
      });
  },
});

export const {
  resetQuiz,
  startQuiz,
  tickTimer,
  selectAnswer,
  showResult,
} = quizSlice.actions;

export default quizSlice.reducer;
