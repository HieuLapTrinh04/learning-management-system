import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import quizReducer from '../features/quiz/quizSlice';
import assignmentReducer from '../features/assignment/assignmentSlice';
import paymentReducer from '../features/payment/paymentSlice';
import certificateReducer from '../features/certificate/certificateSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import notificationReducer from '../features/notification/notificationSlice';
import cartReducer from '../features/cart/cartSlice';
import couponReducer from '../features/coupon/couponSlice';
import reviewReducer from '../features/review/reviewSlice';
import tenantReducer from '../features/tenant/tenantSlice';
import withdrawalReducer from '../features/payment/withdrawalSlice';

export const store = configureStore({
  reducer: {
    tenant: tenantReducer,
    auth: authReducer,
    quiz: quizReducer,
    assignment: assignmentReducer,
    payment: paymentReducer,
    withdrawal: withdrawalReducer,
    certificate: certificateReducer,
    dashboard: dashboardReducer,
    notification: notificationReducer,
    cart: cartReducer,
    coupon: couponReducer,
    review: reviewReducer,
  },
});



