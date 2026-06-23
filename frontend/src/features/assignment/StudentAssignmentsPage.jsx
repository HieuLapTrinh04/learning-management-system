import React, { useState } from 'react';
import AssignmentList from './AssignmentList';
import StudentAssignment from './StudentAssignment';

export default function StudentAssignmentsPage({ token }) {
  const [activeAssignment, setActiveAssignment] = useState(null);

  return activeAssignment ? (
    <StudentAssignment 
      assignment={activeAssignment}
      token={token} 
      onBack={() => setActiveAssignment(null)} 
    />
  ) : (
    <AssignmentList 
      token={token}
      role="student"
      onSelectAssignment={(assignment) => setActiveAssignment(assignment)}
    />
  );
}
