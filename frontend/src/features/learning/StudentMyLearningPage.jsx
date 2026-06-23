import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StudentMyCourses from './StudentMyCourses';
import LearningCenter from './LearningCenter';

export default function StudentMyLearningPage({ token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCourseId = searchParams.get('learningCourseId');
  const [learningCourseId, setLearningCourseId] = useState(queryCourseId);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  useEffect(() => {
    if (queryCourseId) {
      setLearningCourseId(queryCourseId);
    }
  }, [queryCourseId]);

  const handleBack = () => {
    setLearningCourseId(null);
    // Clear search parameters
    setSearchParams({});
  };

  return learningCourseId ? (
    <LearningCenter 
      courseId={learningCourseId} 
      token={token} 
      onBack={handleBack} 
    />
  ) : (
    <StudentMyCourses 
      token={token}
      myEnrollments={myEnrollments}
      setMyEnrollments={setMyEnrollments}
      isLoadingEnrollments={isLoadingEnrollments}
      setIsLoadingEnrollments={setIsLoadingEnrollments}
      onStartLearning={(courseId) => {
        setLearningCourseId(courseId);
        setSearchParams({ learningCourseId: courseId });
      }}
    />
  );
}
