import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { submitAssignment, resetUpload, fetchMySubmission } from './assignmentSlice';
import {
  Upload,
  FileUp,
  CheckCircle2,
  Loader2,
  AlertCircle,
  File,
  X,
  Cloud,
  Sparkles,
  FileText,
  Image,
  FileArchive,
  ArrowLeft,
} from 'lucide-react';

const FILE_ICONS = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  zip: FileArchive,
  rar: FileArchive,
};

function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || File;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function StudentAssignment({ assignment, token: propToken, onBack }) {
  const token = propToken || localStorage.getItem('lms_token') || '';
  const dispatch = useDispatch();
  const { uploadPhase, uploadedSubmission, uploadError } = useSelector((s) => s.assignment);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((file) => {
    if (file && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file);
      dispatch(resetUpload());
    } else if (file) {
      alert('Tệp vượt quá giới hạn 10MB. Vui lòng chọn tệp nhỏ hơn.');
    }
  }, [dispatch]);

  useEffect(() => {
    // Reset Redux upload state and fetch previous submission when viewing a new assignment
    dispatch(resetUpload());
    if (assignment?.id) {
      dispatch(fetchMySubmission({ assignmentId: assignment.id, token }));
    }
    return () => {
      dispatch(resetUpload());
    };
  }, [dispatch, assignment?.id, token]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleSubmit = () => {
    if (!selectedFile || !assignment?.id) return;
    dispatch(submitAssignment({ assignmentId: assignment.id, file: selectedFile, token }));
  };

  const handleReset = () => {
    setSelectedFile(null);
    dispatch(resetUpload());
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.name) : File;
  const isOverdue = assignment?.due_date && new Date(assignment.due_date) < new Date();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-amber-500 uppercase tracking-widest transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Quay lại</span>
      </button>

      {/* Assignment Info Card */}
      <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl"></div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 flex-shrink-0">
              <FileUp className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-slate-100">{assignment?.title || 'Bài tập'}</h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{assignment?.description || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 text-center">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Điểm tối đa</span>
              <span className="text-lg font-extrabold text-amber-500 font-mono block">{assignment?.max_score || 10}</span>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 text-center">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Hạn nộp</span>
              <span className={`text-[11px] font-bold block mt-1 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                {assignment?.due_date ? new Date(assignment.due_date).toLocaleDateString('vi-VN') : '—'}
              </span>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Trạng thái</span>
              <span className={`text-[11px] font-bold block mt-1 ${isOverdue ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOverdue ? 'Đã quá hạn' : 'Đang mở'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Success / Previous Submission State */}
      {(uploadPhase === 'success' || uploadedSubmission) && (
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border 
              ${uploadedSubmission?.file_url === '' 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              {uploadedSubmission?.file_url === '' ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h3 className={`text-sm font-bold ${uploadedSubmission?.file_url === '' ? 'text-red-400' : 'text-emerald-400'}`}>
                {uploadedSubmission?.file_url === '' ? 'Chưa nộp bài' : 'Đã nộp bài'}
              </h3>
              <p className="text-xs text-slate-400">
                {uploadedSubmission?.file_url === '' 
                  ? 'Hệ thống tự động chấm điểm do quá hạn.'
                  : 'Tệp của bạn đã được ghi nhận vào hệ thống.'}
                {uploadedSubmission?.submitted_at && ` Nộp lúc: ${new Date(uploadedSubmission.submitted_at).toLocaleString('vi-VN')}`}
              </p>
            </div>
          </div>

          {/* Grade Display */}
          {uploadedSubmission?.score !== undefined && uploadedSubmission?.score !== null && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 mt-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Điểm số</span>
                  <div className="text-2xl font-extrabold text-amber-500 font-mono">
                    {uploadedSubmission.score} <span className="text-sm text-slate-500">/ {assignment?.max_score || 10}</span>
                  </div>
                </div>
              </div>
              {uploadedSubmission.feedback && (
                <div className="bg-slate-900 rounded-xl p-4 mt-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Nhận xét từ giảng viên</span>
                  <p className="text-sm text-slate-300 italic">"{uploadedSubmission.feedback}"</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {uploadedSubmission?.file_url && (
              <a
                href={uploadedSubmission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                <span>Xem tệp đã nộp</span>
              </a>
            )}
            
            {/* Allow re-submission if not graded yet */}
            {(uploadedSubmission?.score === undefined || uploadedSubmission?.score === null) && (
              <button
                onClick={handleReset}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Nộp lại tệp khác</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {uploadPhase !== 'success' && !uploadedSubmission && (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-amber-500/50 bg-amber-500/5 scale-[1.01]'
                : selectedFile
                  ? 'border-sky-500/30 bg-sky-500/5'
                  : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar,.txt,.pptx,.xlsx"
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 mx-auto">
                  <FileIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200 truncate max-w-sm mx-auto">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="inline-flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 transition"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa tệp</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-300">
                    Kéo thả tệp vào đây hoặc <span className="text-amber-500">nhấp để chọn</span>
                  </p>
                  <p className="text-[10px] text-slate-500">PDF, DOC, DOCX, PNG, JPG, ZIP — Tối đa 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 flex gap-3 text-red-400 items-start">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="text-xs">{uploadError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || uploadPhase === 'uploading' || isOverdue}
            className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-slate-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
          >
            {uploadPhase === 'uploading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang tải lên Cloudinary...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Nộp bài tập</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Info footer */}
      <div className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4 text-[10px] text-slate-500 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-amber-500/50 flex-shrink-0" />
        <p>Tệp bài tập sẽ được lưu trữ trên Cloudinary CDN. Giảng viên sẽ chấm điểm và phản hồi kết quả qua hệ thống thông báo.</p>
      </div>
    </div>
  );
}
