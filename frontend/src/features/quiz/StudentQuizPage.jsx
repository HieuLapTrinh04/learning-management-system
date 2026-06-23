import React, { useState } from 'react';
import QuizSelector from './QuizSelector';
import QuizPlayer from './QuizPlayer';

export default function StudentQuizPage({ token }) {
  const [activeQuizId, setActiveQuizId] = useState(null);

  return activeQuizId ? (
    <QuizPlayer 
      quizId={activeQuizId} 
      token={token} 
      onBack={() => setActiveQuizId(null)} 
    />
  ) : (
    <QuizSelector 
      token={token}
      onSelectQuiz={(id) => setActiveQuizId(id)}
    />
  );
}
