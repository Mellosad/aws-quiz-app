import React, { useState, useEffect, useCallback } from 'react';
import '../styles/WeaknessAnalysisPage.css';

function WeaknessAnalysisPage({ onStartWeaknessQuiz }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 반복해서 틀리는 문제 찾기 함수를 useCallback으로 최적화
  const findRepeatedErrors = useCallback((questions) => {
    const errorCount = {};
    
    questions.forEach(q => {
      if (!q.isCorrect) {
        const key = q.questionId;
        errorCount[key] = (errorCount[key] || 0) + 1;
      }
    });

    return Object.entries(errorCount)
      .filter(([, count]) => count >= 2)
      .map(([questionId, count]) => {
        const question = questions.find(q => q.questionId === parseInt(questionId));
        return { ...question, errorCount: count };
      })
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);
  }, []);

  // 분석 데이터 로드 함수를 useCallback으로 최적화
  const loadAnalysisData = useCallback(() => {
    try {
      const quizRecords = JSON.parse(localStorage.getItem('quizRecords') || '[]');
      
      if (quizRecords.length === 0) {
        setLoading(false);
        return;
      }

      // 전체 문제 데이터 수집
      const allQuestions = [];
      const categoryStats = {};
      const weakQuestions = [];

      quizRecords.forEach(record => {
        record.questions.forEach(q => {
          allQuestions.push(q);
          
          const category = q.category || 'General';
          if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, correct: 0, questions: [] };
          }
          
          categoryStats[category].total++;
          categoryStats[category].questions.push(q);
          
          if (q.isCorrect) {
            categoryStats[category].correct++;
          } else {
            weakQuestions.push(q);
          }
        });
      });

      // 카테고리별 정답률 계산
      const categoryAnalysis = Object.entries(categoryStats).map(([category, data]) => ({
        category,
        total: data.total,
        correct: data.correct,
        incorrect: data.total - data.correct,
        percentage: Math.round((data.correct / data.total) * 100),
        questions: data.questions
      })).sort((a, b) => a.percentage - b.percentage);

      // 전체 통계
      const totalQuestions = allQuestions.length;
      const totalCorrect = allQuestions.filter(q => q.isCorrect).length;
      const overallPercentage = Math.round((totalCorrect / totalQuestions) * 100);

      // 가장 약한 카테고리들
      const weakestCategories = categoryAnalysis.filter(cat => cat.percentage < 70);

      // 최근 실수한 문제들
      const recentErrors = weakQuestions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      // 반복해서 틀리는 문제들
      const repeatedErrors = findRepeatedErrors(allQuestions);

      setAnalysisData({
        categoryAnalysis,
        totalQuestions,
        totalCorrect,
        overallPercentage,
        weakestCategories,
        recentErrors,
        repeatedErrors,
        lastUpdated: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
      setLoading(false);
    }
  }, [findRepeatedErrors]);

  useEffect(() => {
    loadAnalysisData();
  }, [loadAnalysisData]);

  // 약점 수준 결정 함수
  const getWeaknessLevel = useCallback((percentage) => {
    if (percentage >= 80) return { level: '우수', color: '#00E676', icon: '🏆' };
    if (percentage >= 70) return { level: '양호', color: '#4A90E2', icon: '👍' };
    if (percentage >= 60) return { level: '보통', color: '#FF8A00', icon: '📚' };
    if (percentage >= 50) return { level: '주의', color: '#FF6B35', icon: '⚠️' };
    return { level: '취약', color: '#FF4444', icon: '🚨' };
  }, []);

  // 약점 퀴즈 시작 함수
  const startWeaknessQuiz = useCallback((category = null) => {
    if (!analysisData) return;

    let targetQuestions = [];

    if (category) {
      // 특정 카테고리의 틀린 문제들
      const categoryData = analysisData.categoryAnalysis.find(cat => cat.category === category);
      if (categoryData) {
        targetQuestions = categoryData.questions.filter(q => !q.isCorrect);
      }
    } else {
      // 전체 약점 문제들
      targetQuestions = [...analysisData.recentErrors, ...analysisData.repeatedErrors];
      // 중복 제거
      const uniqueQuestions = targetQuestions.reduce((acc, current) => {
        const existing = acc.find(item => item.questionId === current.questionId);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);
      targetQuestions = uniqueQuestions;
    }

    if (targetQuestions.length > 0) {
      onStartWeaknessQuiz(targetQuestions, category);
    }
  }, [analysisData, onStartWeaknessQuiz]);

  if (loading) {
    return (
      <div className="weakness-analysis-page">
        <div className="loading">분석 데이터를 처리하는 중...</div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="weakness-analysis-page">
        <div className="empty-analysis">
          <div className="empty-icon">📊</div>
          <h3>분석할 데이터가 없습니다</h3>
          <p>퀴즈를 완료하면 약점 분석이 가능합니다</p>
          <div className="empty-tips">
            <h4>💡 분석 가능한 항목들</h4>
            <ul>
              <li>카테고리별 정답률 및 약점 영역</li>
              <li>반복해서 틀리는 문제 패턴</li>
              <li>최근 실수 경향 분석</li>
              <li>개인 맞춤 학습 권장사항</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="weakness-analysis-page">
      <div className="analysis-header">
        <h1>📈 약점 분석 대시보드</h1>
        <p>나의 학습 패턴을 분석하고 약점을 파악해보세요</p>
        <div className="last-updated">
          마지막 업데이트: {new Date(analysisData.lastUpdated).toLocaleString('ko-KR')}
        </div>
      </div>

      {/* 전체 통계 요약 */}
      <div className="overall-stats">
        <div className="stat-card main-stat">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.overallPercentage}%</div>
            <div className="stat-label">전체 정답률</div>
            <div className="stat-detail">
              {analysisData.totalCorrect}문제 정답 / {analysisData.totalQuestions}문제 도전
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.categoryAnalysis.length}</div>
            <div className="stat-label">학습 영역</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.weakestCategories.length}</div>
            <div className="stat-label">취약 영역</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.repeatedErrors.length}</div>
            <div className="stat-label">반복 실수</div>
          </div>
        </div>
      </div>

      {/* 카테고리별 분석 */}
      <div className="category-analysis">
        <h2>📊 영역별 성과 분석</h2>
        <div className="category-grid">
          {analysisData.categoryAnalysis.map((category, index) => {
            const weakness = getWeaknessLevel(category.percentage);
            return (
              <div key={index} className={`category-card ${category.percentage < 70 ? 'weak' : ''}`}>
                <div className="category-header">
                  <div className="category-name">
                    <span className="category-icon">{weakness.icon}</span>
                    <span>{category.category}</span>
                  </div>
                  <div className="category-percentage" style={{ color: weakness.color }}>
                    {category.percentage}%
                  </div>
                </div>
                
                <div className="category-stats">
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: weakness.color
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="category-details">
                    <span>정답: {category.correct}</span>
                    <span>오답: {category.incorrect}</span>
                    <span>총 {category.total}문제</span>
                  </div>
                </div>
                
                <div className="category-actions">
                  <button 
                    className="weakness-level"
                    style={{ backgroundColor: weakness.color }}
                  >
                    {weakness.level}
                  </button>
                  
                  {category.incorrect > 0 && (
                    <button 
                      className="study-weak-btn"
                      onClick={() => startWeaknessQuiz(category.category)}
                    >
                      약점 보완
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 최근 실수 문제들 */}
      {analysisData.recentErrors.length > 0 && (
        <div className="recent-errors">
          <h2>🔥 최근 실수한 문제들</h2>
          <div className="error-list">
            {analysisData.recentErrors.slice(0, 5).map((question, index) => (
              <div key={index} className="error-item">
                <div className="error-info">
                  <span className="error-category">{question.category}</span>
                  <span className="error-question">
                    Q{question.questionId}: {question.question.substring(0, 100)}
                    {question.question.length > 100 && '...'}
                  </span>
                  <span className="error-date">
                    {new Date(question.timestamp).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="study-recent-errors-btn"
            onClick={() => startWeaknessQuiz()}
          >
            📚 최근 실수 문제 복습하기
          </button>
        </div>
      )}

      {/* 반복 실수 문제들 */}
      {analysisData.repeatedErrors.length > 0 && (
        <div className="repeated-errors">
          <h2>🚨 반복해서 틀리는 문제들</h2>
          <p className="section-description">
            같은 문제를 여러 번 틀렸습니다. 집중적인 학습이 필요한 영역입니다.
          </p>
          <div className="repeated-error-list">
            {analysisData.repeatedErrors.map((question, index) => (
              <div key={index} className="repeated-error-item">
                <div className="error-badge">
                  {question.errorCount}회 실수
                </div>
                <div className="error-content">
                  <div className="error-header">
                    <span className="error-category">{question.category}</span>
                    <span className="question-id">Q{question.questionId}</span>
                  </div>
                  <div className="error-question">
                    {question.question.substring(0, 150)}
                    {question.question.length > 150 && '...'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학습 권장사항 */}
      <div className="recommendations">
        <h2>💡 학습 권장사항</h2>
        <div className="recommendation-list">
          {analysisData.weakestCategories.length > 0 && (
            <div className="recommendation-item">
              <div className="rec-icon">⚠️</div>
              <div className="rec-content">
                <h4>취약 영역 집중 학습</h4>
                <p>
                  {analysisData.weakestCategories.map(cat => cat.category).join(', ')} 영역의 
                  정답률이 70% 미만입니다. 해당 영역의 개념을 다시 정리해보세요.
                </p>
              </div>
            </div>
          )}
          
          {analysisData.repeatedErrors.length > 0 && (
            <div className="recommendation-item">
              <div className="rec-icon">🔄</div>
              <div className="rec-content">
                <h4>반복 실수 문제 재학습</h4>
                <p>
                  동일한 문제를 반복해서 틀리고 있습니다. 
                  해당 문제의 해설을 충분히 이해하고 관련 개념을 학습하세요.
                </p>
              </div>
            </div>
          )}
          
          {analysisData.overallPercentage < 80 && (
            <div className="recommendation-item">
              <div className="rec-icon">📈</div>
              <div className="rec-content">
                <h4>전체적인 실력 향상 필요</h4>
                <p>
                  전체 정답률이 80% 미만입니다. 
                  기본 개념을 다시 한번 점검하고 꾸준한 문제 풀이를 권장합니다.
                </p>
              </div>
            </div>
          )}

          {analysisData.overallPercentage >= 80 && analysisData.weakestCategories.length === 0 && (
            <div className="recommendation-item">
              <div className="rec-icon">🎉</div>
              <div className="rec-content">
                <h4>훌륭한 성과입니다!</h4>
                <p>
                  전체 정답률이 우수하고 취약 영역이 없습니다. 
                  현재 수준을 유지하며 새로운 문제에 도전해보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 데이터 새로고침 버튼 */}
      <div className="refresh-section">
        <button 
          className="refresh-data-btn"
          onClick={loadAnalysisData}
        >
          🔄 데이터 새로고침
        </button>
      </div>
    </div>
  );
}

export default WeaknessAnalysisPage;
