import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  BookOpen, 
  GraduationCap, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Tag,
  DollarSign
} from 'lucide-react';

export default function CourseCatalog({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [searchParams] = useSearchParams();
  const roadmapId = searchParams.get('roadmap');
  const [roadmapDetails, setRoadmapDetails] = useState(null);

  // Filter & Search states
  const [searchVal, setSearchVal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceType, setSelectedPriceType] = useState('all'); // 'all', 'free', 'paid'

  const fetchFilters = async () => {
    try {
      const response = await axios.get('/api/v1/categories');
      const catData = response.data?.data || response.data || [];
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error('Failed to load categories filter');
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Build query string params matching CourseRepository search logic
      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedPriceType !== 'all') params.append('price', selectedPriceType);

      let responseData;
      if (roadmapId) {
        const response = await axios.get(`/api/v1/learning-paths/${roadmapId}`);
        responseData = response.data?.data?.courses?.map(pc => pc.course) || [];
        setRoadmapDetails(response.data?.data);
      } else {
        const response = await axios.get(`/api/v1/courses?${params.toString()}`);
        responseData = response.data;
      }
      
      // The search endpoint returns { data: courses[], total: count } or directly array of courses depending on API design.
      // Looking at courseRepo.Search, it returns []Course, int64. In handler it returns array in data or direct list.
      // Let's support both response formats.
      if (Array.isArray(responseData)) {
        setCourses(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        setCourses(responseData.data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến cơ sở dữ liệu khóa học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCourses();
    }, 300); // 300ms debounce for live search!

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, selectedCategory, selectedPriceType]);

  return (
    <div className="space-y-6">
      
      {/* Title Board */}
      <div className="max-w-3xl mx-auto py-6">
        {roadmapId && roadmapDetails ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <Link to="/student/roadmaps" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 text-sm font-medium transition-colors bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 hover:border-amber-500/50">
              ← Trở lại các Lộ trình học tập
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-amber-500 tracking-tight leading-tight mt-4">
              {roadmapDetails.title}
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              {roadmapDetails.description}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Khám phá các khóa học <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">Xuất Sắc</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Trau dồi năng lực lập trình và kiến thức chuyên sâu cùng đội ngũ giảng viên giàu kinh nghiệm.
            </p>
          </div>
        )}
      </div>


      {/* Filter and Search Box Panel - Hide if viewing a roadmap */}
      {!roadmapId && (
      <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm kiếm khóa học (ví dụ: Golang, Fiber)..."
            className="block w-full pl-10 pr-4 py-3 bg-[#0c101a] border border-slate-850 focus:border-amber-500/50 rounded-xl text-slate-200 placeholder-slate-650 focus:outline-none text-xs transition"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-850 focus:border-amber-500/50 rounded-xl text-slate-400 focus:outline-none text-xs transition"
          >
            <option value="">Tất cả chuyên mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Price Filter */}
        <div className="relative">
          <select
            value={selectedPriceType}
            onChange={(e) => setSelectedPriceType(e.target.value)}
            className="block w-full px-4 py-3 bg-[#0c101a] border border-slate-850 focus:border-amber-500/50 rounded-xl text-slate-400 focus:outline-none text-xs transition"
          >
            <option value="all">Tất cả mức giá</option>
            <option value="free">Miễn phí</option>
            <option value="paid">Có học phí</option>
          </select>
        </div>

      </div>
      )}

      {/* API Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Catalog Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs text-slate-500">Đang chọn lọc các khóa học phù hợp nhất...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-500 border border-dashed border-slate-900 rounded-3xl">
          Không tìm thấy khóa học nào phù hợp với bộ lọc tìm kiếm. Vui lòng thử từ khóa khác.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              onClick={() => onSelectCourse && onSelectCourse(course.id)}
              className="group bg-slate-900/20 border border-slate-900 hover:border-amber-500/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/5 transition duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Course Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-slate-950 to-slate-900 border-b border-slate-900 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition duration-300 z-10"></div>
                  
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-slate-800 group-hover:text-amber-500/80 transition duration-300" />
                  )}
                  
                  {/* Category Tag overlay */}
                  {course.category && (
                    <span className="absolute top-4 left-4 text-[9px] uppercase tracking-wider font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                      {course.category.name}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-500 transition duration-200 leading-snug line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {course.subtitle || course.description}
                  </p>
                </div>
              </div>

              {/* Card Footer info */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-900/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                    {(course.teacher?.name || 'T')[0]}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{course.teacher?.name || 'Giảng viên'}</span>
                </div>
                
                <div className="font-mono font-bold text-brand-500 text-sm">
                  {course.price === 0 ? (
                    <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">Miễn phí</span>
                  ) : (
                    <span>{course.price?.toLocaleString('vi-VN')}đ</span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
