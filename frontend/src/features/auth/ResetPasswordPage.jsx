import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosClient';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
            return;
        }

        if (newPassword.length < 8) {
            setStatus({ type: 'error', message: 'Mật khẩu phải dài ít nhất 8 ký tự.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post('/api/v1/auth/reset-password', { 
                token,
                new_password: newPassword
            });
            setStatus({ type: 'success', message: 'Đặt lại mật khẩu thành công!' });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-lg text-center">
                    <p className="text-red-600 font-medium mb-4">Không tìm thấy mã xác nhận đặt lại mật khẩu.</p>
                    <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500">Yêu cầu liên kết mới</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Tạo mật khẩu mới
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {status.message && (
                        <div className={`mb-4 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status.message}
                        </div>
                    )}

                    {status.type !== 'success' && (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-slate-700">
                                    Mật khẩu mới
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="new_password"
                                        name="new_password"
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700">
                                    Xác nhận mật khẩu mới
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {isLoading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
