import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { User, Save, Lock, Mail, Camera, Loader2, Upload } from 'lucide-react';
import { AuthContext } from '../../App';

export default function ProfileSettings() {
  const { token, updateAvatar, updateName } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar_url: '',
    role: ''
  });
  
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      alert('Không thể tải thông tin hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return alert('Ảnh không được vượt quá 5MB');
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/api/v1/users/upload-avatar', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data?.success) {
        setProfile({ ...profile, avatar_url: response.data.image_url });
        updateAvatar(response.data.image_url);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate passwords if user wants to change them
    if (passwords.new_password) {
      if (passwords.new_password !== passwords.confirm_password) {
        return alert('Mật khẩu xác nhận không khớp!');
      }
      if (!passwords.current_password) {
        return alert('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới!');
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: profile.name,
        avatar_url: profile.avatar_url,
        current_password: passwords.current_password,
        new_password: passwords.new_password
      };

      const response = await axios.put('/api/v1/users/me', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        alert('Đã cập nhật hồ sơ thành công!');
        // Clear password fields
        setPasswords({ current_password: '', new_password: '', confirm_password: '' });
        // Update top-level AuthContext with new name/avatar
        if (updateName) {
          updateName(profile.name);
        }
        if (updateAvatar) {
          updateAvatar(profile.avatar_url);
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Hồ sơ cá nhân</h1>
        <p className="text-slate-400">Quản lý thông tin tài khoản và bảo mật.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <form onSubmit={handleSave} className="p-8">
          
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-950 flex flex-shrink-0 items-center justify-center relative group-hover:border-amber-500/50 transition-colors">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-700" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="Tải ảnh lên từ máy"
                  >
                    <Upload className="w-8 h-8 text-white" />
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 uppercase tracking-wide border border-amber-500/20">
                  {profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'teacher' ? 'Giảng viên' : 'Học viên'}
                </span>
              </div>
            </div>

            {/* General Info */}
            <div className="flex-1 space-y-5">
              <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" /> Thông tin cơ bản
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Họ và Tên</label>
                  <input 
                    type="text" 
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    required
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email được dùng để đăng nhập và không thể thay đổi.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">URL Ảnh đại diện</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Camera className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="url" 
                    name="avatar_url"
                    value={profile.avatar_url || ''}
                    onChange={handleProfileChange}
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="https://... hoặc tải lên từ máy ở hình bên"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-5 pt-6 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" /> Đổi mật khẩu
            </h3>
            <p className="text-sm text-slate-500 mb-4">Để trống nếu bạn không muốn thay đổi mật khẩu.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  name="current_password"
                  value={passwords.current_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Mật khẩu mới</label>
                <input 
                  type="password" 
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Xác nhận mật khẩu</label>
                <input 
                  type="password" 
                  name="confirm_password"
                  value={passwords.confirm_password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
