import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axiosClient';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Không tìm thấy token xác thực.');
                return;
            }

            try {
                const response = await api.get(`/api/v1/auth/verify-email?token=${token}`);
                if (response.data.success) {
                    setStatus('success');
                    setMessage('Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.');
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Xác thực thất bại. Token có thể đã hết hạn.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Xác thực Email
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {status === 'loading' && (
                        <div>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-slate-600">Đang xác thực email của bạn...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-600 font-medium mb-6">{message}</p>
                            <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                Đi đến trang đăng nhập
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-red-600 font-medium mb-6">{message}</p>
                            <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                                Quay lại đăng nhập
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
