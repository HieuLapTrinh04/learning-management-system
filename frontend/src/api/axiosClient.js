import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HTTPOnly cookies (refresh_token) automatically
});

// Request Interceptor to inject the JWT access token from localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Inject the current hostname to resolve the tenant
    config.headers['X-Tenant-Domain'] = window.location.hostname;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor to intercept 401 Unauthorized errors and perform auto-refresh
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 unauthorized errors and ensure we only retry once per request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Do not attempt refresh on authorization endpoints
      if (
        originalRequest.url.includes('/api/v1/auth/refresh') || 
        originalRequest.url.includes('/api/v1/auth/login')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Access token expired. Attempting token rotation...');
        
        // Execute refresh request using regular axios to bypass standard interceptor
        const response = await axios.post('/api/v1/auth/refresh', {}, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data && response.data.success) {
          const newAccessToken = response.data.data.access_token;
          
          // Write directly to local storage to keep tabs in sync
          localStorage.setItem('lms_token', newAccessToken);
          
          // Fire event to notify Redux store without circular imports
          window.dispatchEvent(new CustomEvent('lms-token-refreshed', { detail: newAccessToken }));
          
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          isRefreshing = false;
          
          return axiosClient(originalRequest);
        } else {
          throw new Error('Refresh response validation failed');
        }
      } catch (refreshError) {
        console.error('Session expired or refresh token rotated out. Clearing auth session.', refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Clear tokens from client
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_role');
        localStorage.removeItem('lms_user_id');
        localStorage.removeItem('lms_user_name');
        
        // Notify Redux store to clear state
        window.dispatchEvent(new CustomEvent('lms-auth-logout'));
        
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
