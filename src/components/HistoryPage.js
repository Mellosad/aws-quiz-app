import React, { useState, useEffect } from 'react';
import '../styles/HistoryPage.css';
import { useTranslation } from 'react-i18next';

function HistoryPage() {
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = () => {
    try {
      const savedHistory = localStorage.getItem('quizRecords');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // 최신순으로 정렬
      const sortedHistory = history.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      );
      
      setQuizHistory(sortedHistory);
      setLoading(false);
    } catch (error) {
      console.error('학습 기록 로드 실패:', error);
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('모든 학습 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('quizRecords');
      setQuizHistory([]);
    }
  };

  const getGradeInfo = (percentage) => {
    if (percentage >= 90) return { grade: '🏆 우수', color: '#FFD700' };
    if (percentage >= 80) return { grade: '🥉 양호', color: '#C0C0C0' };
    if (percentage >= 70) return { grade: '📚 보통', color: '#CD7F32' };
    return { grade: '💪 재도전', color: '#FF6B6B' };
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading">학습 기록을 불러오는 중...</div>
      </div>
    );
  }

  const totalQuizzes = quizHistory.length;
  const averageScore = totalQuizzes > 0 
    ? Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.percentage, 0) / totalQuizzes)
    : 0;
  const totalQuestions = quizHistory.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>{t('history.title')}</h1>
        <p>{t('history.subtitle')}</p>
      </div>
      {totalQuizzes > 0 && (
        <button className="clear-history-btn" onClick={clearHistory}>
          {t('history.clearHistory')}
        </button>
      )}

      {totalQuizzes === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">📊</div>
          <h3>{t('history.empty')}</h3>
          <p>{t('history.emptyGuide')}</p>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-stats">
            <div className="stat-card">
              <div className="stat-number">{totalQuizzes}</div>
              <div className="stat-label">{t('history.completedQuizzes')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{averageScore}%</div>
              <div className="stat-label">{t('history.averageScore')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{totalQuestions}</div>
              <div className="stat-label">{t('history.totalQuestions')}</div>
            </div>
          </div>

          <div className="history-list">
            <h3>{t('history.recentRecords')}</h3>
            {quizHistory.map((quiz, index) => {
              const gradeInfo = getGradeInfo(quiz.percentage);
              return (
                <div key={index} className="history-item">
                  <div className="quiz-info">
                    <div className="quiz-title">{quiz.dumpTitle}</div>
                    <div className="quiz-date">
                      {new Date(quiz.completedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  
                  <div className="quiz-score">
                    <div className="score-display">
                      <span className="score">{quiz.finalScore}/{quiz.totalQuestions}</span>
                      <span className="percentage">({quiz.percentage}%)</span>
                    </div>
                    <div className="grade" style={{ color: gradeInfo.color }}>
                      {gradeInfo.grade}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
