import React, { useState } from 'react';
import CourseCatalog from './CourseCatalog';
import CourseDetail from './CourseDetail';

export default function StudentCoursesPage({ token }) {
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  return selectedCourseId ? (
    <CourseDetail 
      courseId={selectedCourseId} 
      token={token} 
      onBack={() => setSelectedCourseId(null)} 
    />
  ) : (
    <CourseCatalog onSelectCourse={(id) => setSelectedCourseId(id)} />
  );
}
