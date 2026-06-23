import React, { useState } from 'react';
import AssignmentList from './AssignmentList';
import TeacherGrading from './TeacherGrading';

export default function TeacherAssignmentsPage({ token }) {
  const [activeGradingAssignmentId, setActiveGradingAssignmentId] = useState(null);
  const [activeGradingTitle, setActiveGradingTitle] = useState('');

  return activeGradingAssignmentId ? (
    <TeacherGrading 
      assignmentId={activeGradingAssignmentId}
      assignmentTitle={activeGradingTitle}
      token={token} 
      onBack={() => setActiveGradingAssignmentId(null)} 
    />
  ) : (
    <AssignmentList 
      token={token}
      role="teacher"
      onSelectAssignment={(id, title) => { 
        setActiveGradingAssignmentId(id); 
        setActiveGradingTitle(title); 
      }}
    />
  );
}
