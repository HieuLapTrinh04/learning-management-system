import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Map, 
  BookOpen, 
  ArrowRight, 
  Loader2,
  Award,
  Clock,
  Target
} from 'lucide-react';

export default function StudentRoadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const res = await axios.get('/api/v1/learning-paths');
        if (res.data.success) {
          setRoadmaps(res.data.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải lộ trình học tập', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2 md:gap-3">
          <Map className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
          <span>Lộ trình học tập</span>
        </h1>
        <p className="text-slate-400 mt-1.5 md:mt-2 text-xs md:text-sm max-w-2xl">
          Các lộ trình được thiết kế bài bản, xâu chuỗi nhiều khóa học giúp bạn đi từ con số 0 đến khi thành thạo một kỹ năng và đạt được mục tiêu nghề nghiệp.
        </p>
      </div>

      {roadmaps.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3 md:mb-4">
            <Map className="w-5 h-5 md:w-8 md:h-8 text-slate-500" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-200 mb-1.5 md:mb-2">Chưa có lộ trình nào</h3>
          <p className="text-slate-400 text-xs md:text-sm">Hệ thống đang cập nhật các lộ trình học tập mới, vui lòng quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmaps.map(path => (
            <div key={path.id} className="bg-[#0b0e17] border border-slate-800 hover:border-amber-500/50 transition-all duration-300 rounded-2xl overflow-hidden group flex flex-col">
              <div className="aspect-[21/9] bg-slate-900 relative overflow-hidden">
                {path.thumbnail_url ? (
                  <img src={path.thumbnail_url} alt={path.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-slate-900 flex items-center justify-center">
                    <Target className="w-12 h-12 text-amber-500/50" />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Roadmap</span>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-amber-500 transition-colors">
                  {path.title}
                </h2>
                <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">
                  {path.description || 'Chưa có mô tả chi tiết cho lộ trình này.'}
                </p>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span>{path.courses?.length || 0} khóa học</span>
                    </div>
                  </div>
                  
                  {/* Detailed view - In real app this would go to a specific roadmap details page */}
                  <Link 
                    to={`/courses?roadmap=${path.id}`} 
                    className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 group/link"
                  >
                    <span>Khám phá</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
