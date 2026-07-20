import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { 
  Bookmark, 
  Trash2, 
  Edit2, 
  PlayCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';

// Helper to format seconds to MM:SS
const formatVideoTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function LessonNotes({ lessonId, token, currentVideoTime = 0, onSeek }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchNotes = async () => {
    try {
      const res = await axiosClient.get(`/api/v1/lessons/${lessonId}/notes`);
      if (res.data.success) {
        setNotes(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId && token) {
      fetchNotes();
    }
  }, [lessonId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axiosClient.post(`/api/v1/lessons/${lessonId}/notes`, {
        content: content,
        video_timestamp: Math.floor(currentVideoTime)
      });

      if (res.data.success) {
        setContent('');
        fetchNotes();
      }
    } catch (err) {
      console.error('Lỗi thêm ghi chú', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
    
    try {
      await axiosClient.delete(`/api/v1/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Lỗi xóa ghi chú', err);
    }
  };

  const handleUpdate = async (noteId) => {
    if (!editContent.trim()) return;
    
    try {
      await axios.put(`/api/v1/notes/${noteId}`, {
        content: editContent,
        video_timestamp: notes.find(n => n.id === noteId)?.video_timestamp || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingNoteId(null);
      fetchNotes();
    } catch (err) {
      console.error('Lỗi cập nhật ghi chú', err);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl md:rounded-2xl p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-slate-900 pb-3 md:pb-4">
        <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
        <h3 className="font-bold text-sm md:text-base text-slate-200">Ghi chú của tôi</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Add Note */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-[#0b0e17] rounded-xl p-4 border border-slate-900">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Thời điểm ghi chú:</span>
              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded font-bold">
                {formatVideoTime(currentVideoTime)}
              </span>
            </div>
            
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 md:p-3 text-[10px] md:text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 mb-3 resize-none h-20 md:h-24"
              placeholder="Nhập ghi chú cho đoạn video này..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu ghi chú'}
            </button>
          </form>
        </div>

        {/* Notes List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              Bạn chưa có ghi chú nào cho bài học này.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map(note => (
                <div key={note.id} className="bg-[#0b0e17] border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition">
                  <div className="flex justify-between items-start mb-2">
                    <button 
                      onClick={() => onSeek && onSeek(note.video_timestamp)}
                      className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 px-2 py-1 rounded"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      {formatVideoTime(note.video_timestamp)}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {editingNoteId !== note.id && (
                        <>
                          <button 
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditContent(note.content);
                            }}
                            className="text-slate-500 hover:text-sky-500"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(note.id)}
                            className="text-slate-500 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingNoteId === note.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 resize-none h-20"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingNoteId(null)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUpdate(note.id)}
                          className="p-1 text-sky-500 hover:text-sky-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 whitespace-pre-line mt-2">
                      {note.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
