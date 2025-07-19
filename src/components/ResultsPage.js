import React, { useState } from 'react';
import '../styles/ResultsPage.css';

function ResultsPage({ quizResult, onBackToDumpSelector }) {
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  if (!quizResult) {
    return (
      <div className="results-page">
        <div className="loading">결과를 불러오는 중...</div>
      </div>
    );
  }

  const { dumpTitle, totalQuestions, finalScore, percentage, completedAt, questions } = quizResult;
  const incorrectQuestions = questions.filter(q => !q.isCorrect);
  
  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: '🏆 우수', color: '#FFD700' };
    if (percentage >= 80) return { grade: '🥉 양호', color: '#C0C0C0' };
    if (percentage >= 70) return { grade: '📚 보통', color: '#CD7F32' };
    return { grade: '💪 재도전', color: '#FF6B6B' };
  };

  const gradeInfo = getGrade(percentage);

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>🎉 퀴즈 완료!</h1>
        <button className="back-home-btn" onClick={onBackToDumpSelector}>
          🏠 홈으로 돌아가기
        </button>
      </div>

      <div className="results-summary">
        <div className="summary-card">
          <h2>{dumpTitle}</h2>
          <div className="score-display">
            <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
              <span className="score-number">{finalScore}</span>
              <span className="score-total">/ {totalQuestions}</span>
            </div>
            <div className="grade-info">
              <div className="percentage">{percentage}%</div>
              <div className="grade" style={{ color: gradeInfo.color }}>
                {gradeInfo.grade}
              </div>
            </div>
          </div>
          <div className="completion-time">
            완료 시간: {new Date(completedAt).toLocaleString('ko-KR')}
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-item correct">
            <span className="stat-number">{finalScore}</span>
            <span className="stat-label">정답</span>
          </div>
          <div className="stat-item incorrect">
            <span className="stat-number">{totalQuestions - finalScore}</span>
            <span className="stat-label">오답</span>
          </div>
          <div className="stat-item total">
            <span className="stat-number">{totalQuestions}</span>
            <span className="stat-label">총 문제</span>
          </div>
        </div>
      </div>

      {incorrectQuestions.length > 0 && (
        <div className="wrong-answers-section">
          <h3>❌ 오답 문제 ({incorrectQuestions.length}개)</h3>
          <div className="wrong-answers-list">
            {incorrectQuestions.map((question, index) => (
              <div key={question.questionId} className="wrong-answer-item">
                <div className="question-preview">
                  <strong>Q{questions.findIndex(q => q.questionId === question.questionId) + 1}.</strong> 
                  {question.question.substring(0, 100)}
                  {question.question.length > 100 && '...'}
                </div>
                <div className="answer-info">
                  <span className="user-answer">
                    내 답: {Array.isArray(question.userAnswers) 
                      ? question.userAnswers.map(i => String.fromCharCode(65 + i)).join(', ')
                      : String.fromCharCode(65 + question.userAnswers)
                    }
                  </span>
                  <span className="correct-answer">
                    정답: {Array.isArray(question.correctAnswer)
                      ? question.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')
                      : String.fromCharCode(65 + question.correctAnswer)
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="review-section">
        <div className="section-header">
          <h3>📋 전체 문제 리뷰</h3>
          <button 
            className="toggle-btn"
            onClick={() => setShowAllQuestions(!showAllQuestions)}
          >
            {showAllQuestions ? '접기 ▲' : '펼치기 ▼'}
          </button>
        </div>
        
        {showAllQuestions && (
          <div className="all-questions-review">
            {questions.map((question, index) => (
              <div key={question.questionId} className={`question-review-item ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="question-header-review">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-status">
                    {question.isCorrect ? '✅' : '❌'}
                  </div>
                </div>
                
                <div className="question-content">
                  <h4>{question.question}</h4>
                  
                  <div className="answer-comparison">
                    <div className="user-choice">
                      <strong>내 선택:</strong>
                      <span className={question.isCorrect ? 'correct-choice' : 'wrong-choice'}>
                        {Array.isArray(question.userAnswers) 
                          ? question.userAnswers.map(i => String.fromCharCode(65 + i)).join(', ')
                          : String.fromCharCode(65 + question.userAnswers)
                        }
                      </span>
                    </div>
                    
                    {!question.isCorrect && (
                      <div className="correct-choice-display">
                        <strong>정답:</strong>
                        <span className="correct-answer-text">
                          {Array.isArray(question.correctAnswer)
                            ? question.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')
                            : String.fromCharCode(65 + question.correctAnswer)
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {question.explanation && (
                    <div className="explanation-review">
                      <strong>해설:</strong>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="retry-btn" onClick={onBackToDumpSelector}>
          🔄 다시 도전하기
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
