import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { FileText, Download, Loader2 } from 'lucide-react';

export default function LessonAttachments({ lessonId, token }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      const fetchAttachments = async () => {
        try {
          setLoading(true);
          const res = await axiosClient.get(`/api/v1/lessons/${lessonId}/attachments`);
          if (res.data && res.data.success) {
            setAttachments(res.data.data || []);
          }
        } catch (err) {
          console.error('Failed to fetch attachments', err);
        } finally {
          setLoading(false);
        }
      };
      fetchAttachments();
    }
  }, [lessonId, token]);

  if (loading) {
    return <div className="py-10 text-center text-slate-500 text-xs flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  if (attachments.length === 0) {
    return (
      <div className="py-10 text-center text-slate-500 flex flex-col items-center gap-2">
        <FileText className="w-8 h-8 text-slate-800" />
        <span className="text-[10px]">Bài giảng này không có tài liệu đính kèm.</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {attachments.map(file => (
        <a 
          key={file.id}
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.file_name}
          className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-slate-200 truncate" title={file.file_name}>
              {file.file_name}
            </h4>
            {file.file_size > 0 && (
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                {(file.file_size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </div>
          <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
        </a>
      ))}
    </div>
  );
}
