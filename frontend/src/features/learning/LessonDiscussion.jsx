import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { MessageSquare, Send, User, Trash2, Reply, Loader2 } from 'lucide-react';

export default function LessonDiscussion({ lessonId, token }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id: 1, name: 'John Doe' }

  const currentUserStr = localStorage.getItem('lms_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/api/v1/lessons/${lessonId}/discussions`);
      if (res.data && res.data.success) {
        setDiscussions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch discussions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchDiscussions();
      setReplyTo(null);
      setContent('');
    }
  }, [lessonId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const payload = { content };
      if (replyTo) {
        payload.parent_id = replyTo.id;
      }

      const res = await axiosClient.post(`/api/v1/lessons/${lessonId}/discussions`, payload);

      if (res.data && res.data.success) {
        setContent('');
        setReplyTo(null);
        fetchDiscussions(); // Reload threads
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await axiosClient.delete(`/api/v1/discussions/${id}`);
      fetchDiscussions();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bình luận.');
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-slate-500 text-xs flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Input Area */}
      <div className="bg-slate-900/40 p-3 md:p-4 border border-slate-800 rounded-xl md:rounded-2xl">
        {replyTo && (
          <div className="flex items-center justify-between bg-slate-800/50 px-3 py-1.5 rounded-lg mb-3 text-[10px]">
            <span className="text-slate-400">
              Đang trả lời: <strong className="text-amber-500">{replyTo.name}</strong>
            </span>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-slate-500 hover:text-red-400"
            >
              Hủy
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avt" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3 h-3 md:w-4 md:h-4 text-amber-500" />
            )}
          </div>
          <div className="flex-1 flex gap-1.5 md:gap-2">
            <input 
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? "Nhập câu trả lời của bạn..." : "Có thắc mắc? Đặt câu hỏi tại đây..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs text-slate-200 outline-none focus:border-amber-500/50 transition"
            />
            <button 
              type="submit"
              disabled={submitting || !content.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-3 md:px-4 rounded-lg md:rounded-xl flex items-center justify-center transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Discussion Threads */}
      <div className="space-y-5">
        {discussions.length === 0 ? (
          <div className="text-center py-10 text-[10px] text-slate-500 flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-slate-800" />
            <span>Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</span>
          </div>
        ) : (
          discussions.map(thread => (
            <div key={thread.id} className="space-y-3">
              {/* Root Comment */}
              <div className="flex gap-2 md:gap-3 group">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700">
                  {thread.user?.avatar_url ? (
                    <img src={thread.user.avatar_url} alt="avt" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-200">
                      {thread.user?.full_name || 'Người dùng ẩn danh'}
                    </span>
                    {thread.user?.role === 'teacher' || thread.user?.role === 'admin' ? (
                      <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded uppercase font-bold">Giảng viên</span>
                    ) : null}
                    <span className="text-[9px] text-slate-500">
                      {new Date(thread.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/30 p-3 rounded-2xl rounded-tl-none border border-slate-800/50 inline-block">
                    {thread.content}
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <button 
                      onClick={() => setReplyTo({ id: thread.id, name: thread.user?.full_name || 'Người dùng' })}
                      className="text-[10px] text-slate-500 hover:text-amber-500 flex items-center gap-1 transition"
                    >
                      <Reply className="w-3 h-3" /> Trả lời
                    </button>
                    {currentUser && currentUser.id === thread.user_id && (
                      <button 
                        onClick={() => handleDelete(thread.id)}
                        className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {thread.replies && thread.replies.length > 0 && (
                <div className="pl-11 space-y-3">
                  {thread.replies.map(reply => (
                    <div key={reply.id} className="flex gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-700">
                        {reply.user?.avatar_url ? (
                          <img src={reply.user.avatar_url} alt="avt" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300">
                            {reply.user?.full_name || 'Người dùng ẩn danh'}
                          </span>
                          {reply.user?.role === 'teacher' || reply.user?.role === 'admin' ? (
                            <span className="text-[8px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded uppercase font-bold">Giảng viên</span>
                          ) : null}
                          <span className="text-[9px] text-slate-500">
                            {new Date(reply.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {reply.content}
                        </p>
                        {currentUser && currentUser.id === reply.user_id && (
                          <div className="flex items-center gap-4 pt-0.5">
                            <button 
                              onClick={() => handleDelete(reply.id)}
                              className="text-[9px] text-slate-500 hover:text-red-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
