import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowRight, PlayCircle, Star, Users, Award, 
  MonitorPlay, ShieldCheck, Zap, Briefcase, 
  CheckCircle2, Plus, Minus, ChevronRight, LayoutDashboard, Database, BookOpen, MessageCircle, Quote
} from 'lucide-react';

// Custom component to handle scroll-triggered animations
const RevealOnScroll = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      className={`transition-all duration-1000 ease-out will-change-[opacity,transform] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
      } ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [catRes, courseRes, testimonialRes] = await Promise.all([
          axios.get('/api/v1/categories'),
          axios.get('/api/v1/courses?limit=8'),
          axios.get('/api/v1/testimonials')
        ]);
        
        setCategories(catRes.data?.data || []);
        setFeaturedCourses(courseRes.data?.data || []);
        setTestimonials(testimonialRes.data?.data || [
          { id: 1, name: "Mai Anh", role: "Kỹ sư phần mềm tại Google", avatar_url: "https://i.pravatar.cc/150?img=47", content: "Khóa học Fullstack thực sự đã thay đổi cuộc đời tôi. Lộ trình được thiết kế hoàn hảo và các dự án giúp tôi xây dựng portfolio để nhận được công việc mơ ước.", rating: 5 },
          { id: 2, name: "Hoàng Long", role: "Chuyên gia Dữ liệu tại Amazon", avatar_url: "https://i.pravatar.cc/150?img=11", content: "Tôi chuyển từ kế toán sang công nghệ trong vòng 6 tháng. Các giảng viên đã chia nhỏ các khái niệm phức tạp thành các bài học thực tế, dễ hiểu.", rating: 5 },
          { id: 3, name: "Thu Thủy", role: "Thiết kế Sản phẩm tại Meta", avatar_url: "https://i.pravatar.cc/150?img=5", content: "Điều làm nền tảng này trở nên khác biệt chính là giao diện cao cấp và chất lượng của trình phát video. Việc học trên đây cực kỳ mượt mà và hấp dẫn.", rating: 5 }
        ]);
      } catch (err) {
        console.error("Failed to fetch landing data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const faqs = [
    { q: "Nền tảng này dành cho ai?", a: "Nền tảng của chúng tôi được thiết kế cho tất cả mọi người, từ sinh viên đại học muốn bổ sung kỹ năng thực tế, người đi làm muốn thăng tiến, cho đến những ai muốn chuyển hướng sự nghiệp." },
    { q: "Tôi có được cấp chứng chỉ sau khi học xong không?", a: "Chắc chắn rồi. Sau khi hoàn thành 100% tiến độ và vượt qua các bài kiểm tra, bạn sẽ được cấp chứng chỉ điện tử có giá trị toàn cầu, dễ dàng xác thực qua mã QR." },
    { q: "Thời hạn truy cập khóa học là bao lâu?", a: "Khi bạn đăng ký một khóa học, bạn sẽ có quyền truy cập trọn đời (Lifetime Access) vào toàn bộ tài liệu và video, bao gồm cả các bản cập nhật trong tương lai." },
    { q: "Tôi có thể hoàn tiền nếu không hài lòng?", a: "Chúng tôi có chính sách hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu bạn cảm thấy nội dung khóa học không đúng như cam kết, không cần hỏi lý do." }
  ];

  return (
    <div className="w-full flex flex-col bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* =========================================
          SECTION 1: ULTRA-PREMIUM 3D HERO 
      ========================================== */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden">
        {/* Deep Space Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]"></div>
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

        {/* Animated Particles (CSS Magic) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} 
              className="absolute bg-white rounded-full opacity-20 animate-pulse"
              style={{
                width: Math.random() * 4 + 1 + 'px',
                height: Math.random() * 4 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDuration: (Math.random() * 3 + 2) + 's',
                animationDelay: Math.random() * 2 + 's'
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            
            {/* Left Content (Typography & CTA) */}
            <div className="flex-1 space-y-8 text-center lg:text-left z-20">
              <RevealOnScroll delay={0.1}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700/50 backdrop-blur-md shadow-2xl mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-300 tracking-wide">Phiên bản 2.0 đã ra mắt</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
              </RevealOnScroll>
              
              <RevealOnScroll delay={0.2}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  Học Kỹ Năng <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Thay Đổi</span> Sự Nghiệp
                </h1>
              </RevealOnScroll>
              
              <RevealOnScroll delay={0.3}>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                  Tham gia cùng hàng ngàn học viên học lập trình, kinh doanh, thiết kế, ngoại ngữ và các kỹ năng chuyên môn từ các chuyên gia hàng đầu.
                </p>
              </RevealOnScroll>
              
              <RevealOnScroll delay={0.4}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                  <Link 
                    to="/register" 
                    className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <span>Bắt Đầu Học Ngay</span>
                  </Link>
                  <Link 
                    to="/courses" 
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 text-white font-bold rounded-2xl backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MonitorPlay className="w-5 h-5 opacity-70" />
                    <span>Khám Phá Khóa Học</span>
                  </Link>
                </div>
              </RevealOnScroll>

              {/* Trust Indicators */}
              <RevealOnScroll delay={0.5}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-slate-800/50 mt-12">
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">50K+</div>
                    <div className="text-xs text-slate-500 font-medium">Học viên</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">1K+</div>
                    <div className="text-xs text-slate-500 font-medium">Khóa học</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">200+</div>
                    <div className="text-xs text-slate-500 font-medium">Giảng viên</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-2xl font-bold text-white mb-1">
                      4.9 <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Đánh giá</div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Right Content - Advanced 3D Composition */}
            <div className="flex-1 relative w-full h-[500px] md:h-[600px] perspective-[2000px] hidden lg:block z-10">
              <RevealOnScroll delay={0.3} className="h-full">
                <div className="relative w-full h-full transform-style-3d rotate-y-[-15deg] rotate-x-[10deg] hover:rotate-y-[-5deg] hover:rotate-x-[5deg] transition-transform duration-1000 ease-out">
                  
                  {/* 1. Base Laptop Frame */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[320px] bg-slate-800 rounded-3xl border-[6px] border-slate-700 shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-20 overflow-hidden transform translate-z-[0px]">
                    {/* Laptop Screen Content (Mock Dashboard) */}
                    <div className="w-full h-full bg-[#090d16] p-4 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2 items-center">
                          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                            <LayoutDashboard className="w-3 h-3 text-white" />
                          </div>
                          <div className="w-24 h-3 bg-slate-800 rounded-full"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                          <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-xl border border-indigo-500/20"></div>
                        <div className="h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl border border-emerald-500/20"></div>
                        <div className="h-16 bg-slate-800/50 rounded-xl border border-slate-800"></div>
                      </div>
                      <div className="flex-1 flex gap-4">
                        <div className="flex-1 bg-slate-800/40 rounded-xl border border-slate-800"></div>
                        <div className="w-1/3 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col p-2 gap-2">
                          <div className="w-full h-8 bg-slate-800/80 rounded-md"></div>
                          <div className="w-full h-8 bg-slate-800/80 rounded-md"></div>
                          <div className="w-full h-8 bg-slate-800/80 rounded-md"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none"></div>
                  </div>

                  {/* 2. Floating Certificate (Top Right) */}
                  <div className="absolute top-8 -right-8 w-64 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-40 transform translate-z-[120px] rotate-6 animate-[floating_6s_ease-in-out_infinite]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Award className="w-6 h-6 text-amber-950" />
                      </div>
                      <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wider">Verified</div>
                    </div>
                    <div className="w-2/3 h-2.5 bg-slate-700 rounded-full mb-2"></div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mb-1"></div>
                    <div className="w-4/5 h-1.5 bg-slate-800 rounded-full"></div>
                  </div>

                  {/* 3. Floating Course Card (Bottom Left) */}
                  <div className="absolute -bottom-10 -left-12 w-56 bg-slate-900/90 backdrop-blur-lg border border-slate-700 p-4 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.7)] z-30 transform translate-z-[80px] -rotate-6 animate-[floating_5s_ease-in-out_infinite_reverse]">
                    <div className="w-full aspect-video bg-gradient-to-tr from-pink-500 to-rose-400 rounded-2xl mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="w-3/4 h-3 bg-slate-300 rounded-full mb-2"></div>
                    <div className="w-1/2 h-2 bg-slate-600 rounded-full mb-4"></div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900"></div>
                        <div className="w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-900"></div>
                      </div>
                      <div className="text-xs font-bold text-white">$99.00</div>
                    </div>
                  </div>

                  {/* 4. Floating 3D Badge (Top Left) */}
                  <div className="absolute top-20 left-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-[0_20px_40px_rgba(99,102,241,0.4)] z-50 transform translate-z-[160px] -rotate-12 flex items-center justify-center animate-[floating_4s_ease-in-out_infinite]">
                    <Zap className="w-8 h-8 text-white" />
                  </div>

                  {/* 5. Glowing Orbs behind */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/20 blur-[80px] rounded-full z-0 transform translate-z-[-100px]"></div>

                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 2: FEATURED CATEGORIES
      ========================================== */}
      <section className="py-24 relative z-20 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Khám Phá Các Danh Mục</h2>
              <p className="text-slate-400">Khám phá các kỹ năng đang có nhu cầu cao trên mọi lĩnh vực.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { title: "Lập trình", icon: <MonitorPlay className="w-8 h-8 text-blue-400" />, color: "from-blue-500/20 to-cyan-500/5", count: "120+ Khóa học" },
              { title: "Dữ liệu", icon: <Database className="w-8 h-8 text-emerald-400" />, color: "from-emerald-500/20 to-teal-500/5", count: "85+ Khóa học" },
              { title: "Kinh doanh", icon: <Briefcase className="w-8 h-8 text-amber-400" />, color: "from-amber-500/20 to-orange-500/5", count: "200+ Khóa học" },
              { title: "Thiết kế UI/UX", icon: <LayoutDashboard className="w-8 h-8 text-pink-400" />, color: "from-pink-500/20 to-rose-500/5", count: "60+ Khóa học" },
              { title: "Ngoại ngữ", icon: <MessageCircle className="w-8 h-8 text-purple-400" />, color: "from-purple-500/20 to-indigo-500/5", count: "150+ Khóa học" },
              { title: "Marketing", icon: <Zap className="w-8 h-8 text-yellow-400" />, color: "from-yellow-500/20 to-amber-500/5", count: "90+ Khóa học" }
            ].map((cat, idx) => (
              <RevealOnScroll key={idx} delay={0.1 * idx}>
                <div className={`bg-gradient-to-b ${cat.color} border border-slate-800 hover:border-slate-600 p-6 rounded-3xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 cursor-pointer group h-full`}>
                  <div className="w-14 h-14 rounded-2xl bg-slate-900/80 shadow-inner border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                  <h3 className="font-bold text-white mb-1">{cat.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{cat.count}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 3: POPULAR COURSES
      ========================================== */}
      <section className="py-24 bg-[#050b1a] border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll delay={0.1}>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Các Khóa Học Phổ Biến Nhất</h2>
                <p className="text-slate-400">Tham gia cùng hàng ngàn học viên trong các chương trình được đánh giá cao này.</p>
              </div>
              <Link to="/courses" className="px-6 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-full flex items-center gap-2 transition">
                Xem tất cả khóa học
              </Link>
            </div>
          </RevealOnScroll>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-slate-800/50 animate-pulse rounded-3xl"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.slice(0, 8).map((course, idx) => (
                <RevealOnScroll key={course.id} delay={0.1 * (idx % 4)}>
                  <Link to={`/courses/${course.slug || course.id}`} className="group bg-[#020617] border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(99,102,241,0.1)] hover:-translate-y-1 flex flex-col h-full">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e)=>{e.target.src='https://placehold.co/600x400/1e293b/94a3b8?text=Course'}} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"><BookOpen className="w-10 h-10 text-slate-700" /></div>
                      )}
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-amber-950 text-[10px] font-bold rounded uppercase tracking-wide shadow-lg">Bán chạy</div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded">{course.category?.name || 'Danh mục'}</span>
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" /> 4.9 <span className="text-slate-500 font-normal">(2k)</span>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-white text-lg line-clamp-2 mb-4 group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                      
                      <div className="mt-auto">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-slate-700"></div>
                          <span className="text-xs text-slate-400">{course.teacher?.name || 'Giảng viên Expert'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                          <div className="font-bold text-white text-lg">
                            {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN')} đ`}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-500 flex items-center justify-center transition-colors">
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          SECTION 4: WHY CHOOSE US
      ========================================== */}
      <section className="py-24 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll delay={0.1}>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Thiết kế cho thành công của bạn</h2>
              <p className="text-lg text-slate-400">Mọi thứ bạn cần để làm chủ kỹ năng mới và thăng tiến sự nghiệp, được thiết kế với trải nghiệm học tập cao cấp.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <MonitorPlay />, title: "Học theo nhịp độ riêng", desc: "Tận hưởng quyền truy cập khóa học trọn đời trên mọi thiết bị, mọi nơi, mọi lúc." },
              { icon: <Users />, title: "Chuyên gia hàng đầu", desc: "Học hỏi từ các chuyên gia đang làm việc tại các công ty công nghệ hàng đầu." },
              { icon: <Briefcase />, title: "Dự án thực tế", desc: "Xây dựng các dự án thực tế mà bạn có thể trưng bày trong portfolio của mình." },
              { icon: <Award />, title: "Chứng nhận uy tín", desc: "Nhận chứng chỉ sau khi hoàn thành để chứng minh kỹ năng với nhà tuyển dụng." }
            ].map((feature, idx) => (
              <RevealOnScroll key={idx} delay={0.1 * idx}>
                <div className="relative group p-8 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:bg-slate-800/50 transition-colors h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center mb-6 text-indigo-400 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(feature.icon, { className: "w-8 h-8" })}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 5: LEARNING JOURNEY TIMELINE
      ========================================== */}
      <section className="py-24 bg-[#050b1a] border-y border-slate-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll delay={0.1}>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Lộ Trình Làm Chủ Kỹ Năng</h2>
              <p className="text-slate-400">Một phương pháp đã được chứng minh để đưa bạn từ người mới bắt đầu đến sẵn sàng làm việc.</p>
            </div>
          </RevealOnScroll>

          <div className="relative">
            <RevealOnScroll delay={0.2}>
              <div className="absolute top-[2rem] left-8 w-[calc(100%-4rem)] h-1 bg-slate-800 hidden lg:block">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full"></div>
              </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-6 relative z-10">
              {[
                { step: "01", title: "Khám Phá", desc: "Tìm khóa học hoàn hảo phù hợp với mục tiêu nghề nghiệp của bạn." },
                { step: "02", title: "Học Tập", desc: "Xem các bài giảng video chất lượng cao và đọc tài liệu chuyên sâu." },
                { step: "03", title: "Thực Hành", desc: "Hoàn thành bài tập, câu đố và các dự án thực tế." },
                { step: "04", title: "Thành Tựu", desc: "Nhận chứng chỉ xác thực của bạn và chia sẻ nó trên LinkedIn." }
              ].map((item, idx) => (
                <RevealOnScroll key={idx} delay={0.3 + (idx * 0.2)}>
                  <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left h-full">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-indigo-500 flex items-center justify-center font-bold text-xl text-white mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 6: SUCCESS STORIES
      ========================================== */}
      <section className="py-24 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll delay={0.1}>
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Đừng chỉ nghe những gì chúng tôi nói</h2>
              <p className="text-lg text-slate-400">Hàng ngàn chuyên gia đã thay đổi sự nghiệp của họ nhờ nền tảng của chúng tôi.</p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((review, idx) => (
              <RevealOnScroll key={review.id || idx} delay={0.2 * idx}>
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl relative h-full flex flex-col">
                  <Quote className="absolute top-6 right-6 w-12 h-12 text-slate-800/50" />
                  <div className="flex text-amber-400 mb-6">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-8 relative z-10 flex-1">"{review.content}"</p>
                  <div className="flex items-center gap-4 border-t border-slate-800/50 pt-6 mt-auto">
                    <img src={review.avatar_url || 'https://via.placeholder.com/150'} alt={review.name} className="w-12 h-12 rounded-full border border-slate-700 object-cover" />
                    <div>
                      <h4 className="font-bold text-white">{review.name}</h4>
                      <p className="text-xs text-indigo-400 font-medium">{review.role}</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 7: CERTIFICATE SHOWCASE
      ========================================== */}
      <section className="py-24 bg-gradient-to-b from-[#050b1a] to-[#020617] border-t border-slate-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <RevealOnScroll delay={0.1}>
                <h2 className="text-3xl md:text-5xl font-bold text-white">Chứng minh kỹ năng với Chứng Nhận Uy Tín</h2>
              </RevealOnScroll>
              <RevealOnScroll delay={0.2}>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Chứng chỉ của chúng tôi được công nhận bởi các nhà tuyển dụng hàng đầu. Thêm chúng vào hồ sơ LinkedIn của bạn chỉ bằng một cú nhấp chuột và làm nổi bật hồ sơ năng lực.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={0.3}>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> URL xác minh duy nhất cho mỗi chứng chỉ
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Bảo mật và xác thực bằng công nghệ Blockchain
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Tích hợp LinkedIn chỉ với 1 click
                  </li>
                </ul>
              </RevealOnScroll>
              <RevealOnScroll delay={0.4}>
                <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition">
                  Bắt đầu chinh phục <ArrowRight className="w-4 h-4" />
                </Link>
              </RevealOnScroll>
            </div>
            
            <div className="flex-1 relative w-full aspect-[4/3] perspective-[1000px]">
              <RevealOnScroll delay={0.3} className="h-full w-full">
                {/* 3D Certificate Mockup */}
                <div className="absolute inset-0 transform-style-3d rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-700">
                  <div className="w-[120%] h-[120%] -ml-[10%] -mt-[10%] bg-gradient-to-br from-amber-500/20 to-amber-900/10 blur-[80px] rounded-full absolute z-0"></div>
                  <div className="w-full h-full bg-slate-100 rounded-lg p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 relative z-10 flex flex-col">
                    <div className="flex-1 border-[4px] border-double border-slate-300 flex flex-col items-center justify-center p-8 text-center relative bg-white">
                      <div className="absolute top-4 left-4 w-12 h-12 bg-slate-900 flex items-center justify-center rounded">
                        <Award className="w-6 h-6 text-amber-500" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Chứng Chỉ Hoàn Thành</h3>
                      <h2 className="text-4xl font-serif text-slate-900 mb-6">Lập Trình React Nâng Cao</h2>
                      <p className="text-slate-500 mb-2">Chứng nhận học viên</p>
                      <p className="text-2xl font-bold text-slate-800 border-b border-slate-300 pb-2 px-8 mb-6">John Doe</p>
                      <p className="text-sm text-slate-500 max-w-sm">đã hoàn thành xuất sắc khóa đào tạo 40 giờ về kiến trúc frontend nâng cao.</p>
                      
                      <div className="absolute bottom-8 left-8 text-left">
                        <div className="w-24 h-px bg-slate-400 mb-2"></div>
                        <p className="text-[10px] text-slate-500 uppercase">Giảng viên</p>
                      </div>
                      <div className="absolute bottom-8 right-8">
                        <div className="w-16 h-16 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8 text-amber-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 8: FAQ SECTION
      ========================================== */}
      <section className="py-24 bg-[#020617] border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Câu Hỏi Thường Gặp</h2>
              <p className="text-slate-400">Mọi thông tin bạn cần biết về nền tảng và cách thức hoạt động.</p>
            </div>
          </RevealOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <RevealOnScroll key={idx} delay={0.1 * idx}>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
                  >
                    <span className="font-semibold text-white">{faq.q}</span>
                    {activeFaq === idx ? <Minus className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-slate-500" />}
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          SECTION 9: FINAL CTA
      ========================================== */}
      <section className="py-24 relative overflow-hidden bg-[#050b1a]">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center space-y-8">
          <RevealOnScroll delay={0.1}>
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-2">
              <Zap className="w-8 h-8 text-indigo-400" />
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              Bắt Đầu Hành Trình Ngay Hôm Nay
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.3}>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Tham gia nền tảng học tập cao cấp được thiết kế riêng cho lực lượng lao động hiện đại. Không cần thẻ tín dụng để xem các khóa học miễn phí.
            </p>
          </RevealOnScroll>
          
          <RevealOnScroll delay={0.4}>
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"
              >
                Học Thử Miễn Phí <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-6">Hủy bất cứ lúc nào. Hoàn tiền 100% trong 7 ngày đối với khóa học trả phí.</p>
          </RevealOnScroll>
        </div>
      </section>

    </div>
  );
}

// Keyframes required for the floating animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes floating {
    0% { transform: translateY(0px) translateZ(100px); }
    50% { transform: translateY(-20px) translateZ(100px); }
    100% { transform: translateY(0px) translateZ(100px); }
  }
`;
document.head.appendChild(styleSheet);
