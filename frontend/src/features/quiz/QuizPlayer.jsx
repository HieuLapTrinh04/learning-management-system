import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchQuiz,
  submitQuiz,
  resetQuiz,
  startQuiz,
  tickTimer,
  selectAnswer,
} from './quizSlice';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Trophy,
  XCircle,
  Sparkles,
  Play,
  Send,
  RotateCcw,
  ChevronRight,
  Timer,
  Award,
  Target,
  Zap,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

export default function QuizPlayer({ quizId, token: propToken, onBack }) {
  const token = propToken || localStorage.getItem('lms_token') || '';
  const dispatch = useDispatch();

  const {
    quiz,
    questions,
    phase,
    selectedAnswers,
    timeRemaining,
    timerDuration,
    attempt,
    error,
  } = useSelector((state) => state.quiz);

  const timerRef = useRef(null);

  // ── Load quiz data on mount ──
  useEffect(() => {
    dispatch(resetQuiz());
    dispatch(fetchQuiz({ quizId, token }));
    return () => {
      clearInterval(timerRef.current);
    };
  }, [quizId, dispatch, token]);

  // ── Timer logic ──
  useEffect(() => {
    if (phase === 'inProgress') {
      timerRef.current = setInterval(() => {
        dispatch(tickTimer());
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, dispatch]);

  // ── Auto-submit when timer reaches 0 ──
  useEffect(() => {
    if (phase === 'inProgress' && timeRemaining <= 0 && timerDuration > 0) {
      handleSubmit();
    }
  }, [timeRemaining, phase, timerDuration]);

  // ── Handlers ──
  const handleStart = useCallback(() => {
    const minutes = quiz?.duration || (questions.length <= 5 ? 5 : questions.length <= 10 ? 10 : 15);
    dispatch(startQuiz({ minutes }));
  }, [dispatch, quiz, questions]);

  const handleSelectAnswer = useCallback(
    (questionId, answerId, isMultiple) => {
      dispatch(selectAnswer({ questionId, answerId, isMultiple }));
    },
    [dispatch]
  );

  const handleSubmit = useCallback(() => {
    const submissions = questions.map((q) => ({
      question_id: q.id,
      selected_answer_ids: selectedAnswers[q.id] || [],
    }));
    dispatch(submitQuiz({ quizId, submissions, token }));
    clearInterval(timerRef.current);
  }, [dispatch, quizId, questions, selectedAnswers, token]);

  const handleRetry = useCallback(() => {
    dispatch(resetQuiz());
    dispatch(fetchQuiz({ quizId, token }));
  }, [dispatch, quizId, token]);

  // ── Helpers ──
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[k]?.length > 0
  ).length;

  const timerPercent = timerDuration > 0 ? (timeRemaining / timerDuration) * 100 : 100;
  const isTimeLow = timeRemaining > 0 && timeRemaining <= 60;

  // ═══════════════════════════════════════════
  //  PHASE: LOADING
  // ═══════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs text-slate-500">Đang tải bài kiểm tra...</span>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  PHASE: ERROR / IDLE with error
  // ═══════════════════════════════════════════
  if (error && phase !== 'inProgress') {
    return (
      <div className="max-w-xl mx-auto py-16 space-y-4">
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold">Lỗi truy cập bài kiểm tra</h4>
            <p>{error}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  PHASE: READY (Start screen)
  // ═══════════════════════════════════════════
  if (phase === 'ready' && quiz) {
    const estimatedMinutes = quiz.duration || (questions.length <= 5 ? 5 : questions.length <= 10 ? 10 : 15);

    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-amber-500 uppercase tracking-widest transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại</span>
        </button>

        <div className="bg-slate-900/50 border border-slate-900 rounded-3xl overflow-hidden relative">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl"></div>

          <div className="p-8 sm:p-10 text-center relative z-10 space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto shadow-lg shadow-amber-500/10">
              <Target className="w-10 h-10" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-slate-100">{quiz.title}</h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hoàn thành bài kiểm tra dưới đây để đánh giá mức độ tiếp thu kiến thức.
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <Zap className="w-4 h-4 text-amber-500 mx-auto" />
                <span className="text-lg font-extrabold text-slate-200 font-mono block">
                  {questions.length}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                  Câu hỏi
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <Timer className="w-4 h-4 text-sky-500 mx-auto" />
                <span className="text-lg font-extrabold text-slate-200 font-mono block">
                  {estimatedMinutes}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                  Phút
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                <span className="text-lg font-extrabold text-slate-200 font-mono block">
                  {quiz.passing_score}%
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                  Đạt yêu cầu
                </span>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 text-left text-[11px] text-slate-400 space-y-2 max-w-md mx-auto">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-2">
                Lưu ý trước khi bắt đầu
              </span>
              <p className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Bài kiểm tra được giới hạn <strong className="text-slate-300">{estimatedMinutes} phút</strong>. Hết thời gian sẽ tự nộp bài.</span>
              </p>
              <p className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  Bạn có tối đa <strong className="text-slate-300">{quiz.max_attempts} lần</strong> thử lại.
                  {quiz.attempts?.length > 0 && (
                    <span className="text-amber-500 ml-1">(Đã làm {quiz.attempts.length} lần)</span>
                  )}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Cần đạt <strong className="text-slate-300">{quiz.passing_score}%</strong> trở lên để vượt qua bài kiểm tra.</span>
              </p>
            </div>

            {/* Past Attempts History */}
            {quiz.attempts && quiz.attempts.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-4 text-left max-w-md mx-auto mt-4">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-3">
                  Lịch sử làm bài
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {quiz.attempts.map((att, idx) => {
                    const date = new Date(att.attempted_at).toLocaleString('vi-VN');
                    return (
                      <div key={att.id || idx} className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                        <div className="flex flex-col">
                           <span className="text-xs font-semibold text-slate-300">Lần {quiz.attempts.length - idx}</span>
                           <span className="text-[9px] text-slate-500">{date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`text-sm font-bold font-mono ${att.is_passed ? 'text-emerald-500' : 'text-red-400'}`}>{att.score}%</span>
                           {att.is_passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Start button */}
            {(!quiz.attempts || quiz.attempts.length < quiz.max_attempts) ? (
              <button
                onClick={handleStart}
                className="py-3.5 px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2.5 mx-auto transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt đầu làm bài</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl py-3.5 max-w-md mx-auto text-center flex justify-center items-center gap-2">
                 <XCircle className="w-4 h-4" />
                 <span>Bạn đã hết lượt làm bài (Tối đa {quiz.max_attempts} lần)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  PHASE: IN PROGRESS (Quiz taking)
  // ═══════════════════════════════════════════
  if (phase === 'inProgress' || phase === 'submitting') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#090d16] text-slate-300 font-sans selection:bg-amber-500/30 relative">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 relative z-10">
          
          {/* Header Section (Premium non-sticky) */}
          <div className="bg-[#0f172a] border border-slate-800/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
             {/* Decorative glow */}
             <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
             
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                   <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-center transition-colors">
                     <ArrowLeft className="w-4 h-4 text-slate-300" />
                   </button>
                   <div className="space-y-0.5">
                     <h2 className="text-lg font-bold text-white tracking-tight leading-normal block">{quiz?.title}</h2>
                     <p className="text-[11px] font-medium text-amber-500/80 uppercase tracking-widest block pt-0.5">
                       Đã trả lời {answeredCount} / {questions.length} câu
                     </p>
                   </div>
                </div>

                {/* Timer block */}
                <div className={`px-5 py-3 rounded-xl border flex-shrink-0 ${isTimeLow ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-900/50 border-slate-700/50 text-slate-200'} flex items-center gap-3`}>
                   <Clock className={`w-5 h-5 ${isTimeLow ? 'text-red-400' : 'text-amber-500'}`} />
                   <span className="text-xl font-black font-mono tracking-wider block leading-none pt-0.5">{formatTime(timeRemaining)}</span>
                </div>
             </div>

             {/* Progress Bar */}
             <div className="mt-5 w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
               <div style={{ width: `${(answeredCount / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 ease-out"></div>
             </div>
          </div>

          {/* Questions Container */}
          <div className="space-y-5">
            {questions.map((question, qIdx) => {
              const isMultiple = question.question_type === 'multiple_choice';
              const selected = selectedAnswers[question.id] || [];
              return (
                 <div key={question.id} className="bg-[#0f172a]/60 border border-slate-800/40 rounded-2xl overflow-hidden shadow-md transition-all hover:border-slate-700/50">
                    {/* Question block using GRID */}
                    <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800/50 bg-[#0f172a]/80">
                      <div className="grid grid-cols-[auto_1fr] gap-4">
                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                           <span className="text-base font-black text-amber-500 block leading-none">{qIdx + 1}</span>
                         </div>
                         <div className="pt-1.5">
                           <h3 className="text-base font-semibold text-slate-100 leading-relaxed block pb-1.5">{question.question_text}</h3>
                           <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 block">
                             {isMultiple ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
                           </p>
                         </div>
                      </div>
                    </div>

                    {/* Answers block using GRID */}
                    <div className="p-4 sm:p-5 bg-slate-950/20">
                      <div className="grid grid-cols-1 gap-3">
                         {question.answers?.map((answer) => {
                            const isSelected = selected.includes(answer.id);
                            return (
                               <div 
                                 key={answer.id}
                                 onClick={() => !phase.includes('submitting') && handleSelectAnswer(question.id, answer.id, isMultiple)}
                                 className={`cursor-pointer w-full rounded-xl border px-5 py-3.5 transition-all duration-200 group ${isSelected ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-[#0f172a] border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'}`}
                               >
                                  <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                                     <div className="mt-0.5">
                                        {isSelected ? (
                                           <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                        ) : (
                                           <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                        )}
                                     </div>
                                     <div>
                                        <span className={`block text-sm leading-relaxed ${isSelected ? 'text-amber-100 font-semibold' : 'text-slate-300 font-medium group-hover:text-slate-200'}`}>
                                          {answer.answer_text}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                    </div>
                 </div>
              );
            })}
          </div>

          {/* Submit Action Area */}
          <div className="mt-8 mb-6 bg-[#0f172a] border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
             
             <div className="text-center sm:text-left">
               <h3 className="text-base font-bold text-white mb-1 block">Hoàn thành bài kiểm tra?</h3>
               <p className="text-slate-400 text-xs block">
                 Bạn đã trả lời <strong className="text-amber-500 mx-1">{answeredCount}</strong> trong tổng số {questions.length} câu hỏi.
               </p>
             </div>

             <button
               onClick={handleSubmit}
               disabled={phase === 'submitting' || answeredCount === 0}
               className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
             >
               {phase === 'submitting' ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   <span>Đang xử lý...</span>
                 </>
               ) : (
                 <>
                   <Send className="w-5 h-5" />
                   <span>Nộp bài ngay</span>
                 </>
               )}
             </button>
          </div>

        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  PHASE: RESULT
  // ═══════════════════════════════════════════
  if (phase === 'result' && attempt) {
    const isPassed = attempt.is_passed;
    const score = attempt.score;

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-slate-900/50 border border-slate-900 rounded-3xl overflow-hidden relative">
          {/* Ambient glow based on result */}
          <div
            className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl ${
              isPassed ? 'bg-emerald-500/8' : 'bg-red-500/8'
            }`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl ${
              isPassed ? 'bg-amber-500/5' : 'bg-orange-500/5'
            }`}
          ></div>

          <div className="p-8 sm:p-10 text-center relative z-10 space-y-6">
            {/* Result icon */}
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
                isPassed
                  ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-emerald-500/10'
                  : 'bg-gradient-to-br from-red-600/20 to-red-500/10 border border-red-500/20 text-red-400 shadow-red-500/10'
              }`}
            >
              {isPassed ? (
                <Trophy className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12" />
              )}
            </div>

            {/* Result text */}
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-slate-100">
                {isPassed ? 'Chúc mừng bạn đã vượt qua!' : 'Chưa đạt yêu cầu'}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isPassed
                  ? 'Bạn đã hoàn thành xuất sắc bài kiểm tra này. Tiếp tục phát huy nhé!'
                  : 'Hãy ôn tập lại kiến thức và thử lại. Bạn sẽ làm tốt hơn lần sau!'}
              </p>
            </div>

            {/* Score circle */}
            <div className="relative w-36 h-36 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-900"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${score * 2.64} 264`}
                  className={`transition-all duration-1000 ${
                    isPassed ? 'text-emerald-500' : 'text-red-400'
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    isPassed ? 'text-emerald-500' : 'text-red-400'
                  }`}
                >
                  {score}%
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                  Điểm số
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <BarChart3 className="w-4 h-4 text-amber-500 mx-auto" />
                <span className="text-sm font-extrabold text-slate-200 font-mono block">{score}%</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Kết quả</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <Target className="w-4 h-4 text-sky-500 mx-auto" />
                <span className="text-sm font-extrabold text-slate-200 font-mono block">{quiz?.passing_score || 80}%</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Cần đạt</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                {isPassed ? (
                  <Award className="w-4 h-4 text-emerald-500 mx-auto" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                )}
                <span
                  className={`text-sm font-extrabold font-mono block ${
                    isPassed ? 'text-emerald-500' : 'text-red-400'
                  }`}
                >
                  {isPassed ? 'ĐẠT' : 'CHƯA'}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Trạng thái</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleRetry}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại</span>
              </button>
              <button
                onClick={onBack}
                className="py-2.5 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại lớp học</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4 text-[10px] text-slate-500 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-500/50 flex-shrink-0" />
          <p>Kết quả bài kiểm tra đã được lưu vào hệ thống. Giảng viên có thể xem lại lịch sử làm bài của bạn.</p>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
