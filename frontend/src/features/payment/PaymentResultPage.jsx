import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentResult from './PaymentResult';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParams = {};
  searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  const handleNavigate = (tab) => {
    if (tab === 'my-courses') {
      navigate('/student/my-courses');
    } else if (tab === 'catalog') {
      navigate('/courses');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <PaymentResult 
      queryParams={queryParams} 
      onNavigate={handleNavigate} 
    />
  );
}
