import React, { useState, useEffect, useCallback } from 'react';
import '../styles/WeaknessAnalysisPage.css';
import { useTranslation } from 'react-i18next';

function WeaknessAnalysisPage({ onStartWeaknessQuiz }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

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
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="weakness-analysis-page">
        <div className="empty-analysis">
          <div className="empty-icon">📊</div>
          <h3>{t('weakness.noData')}</h3>
          <p>{t('weakness.noDataGuide')}</p>
          <div className="empty-tips">
            <h4>{t('weakness.analysisItems')}</h4>
            <ul>
              <li>{t('weakness.analysisItem1')}</li>
              <li>{t('weakness.analysisItem2')}</li>
              <li>{t('weakness.analysisItem3')}</li>
              <li>{t('weakness.analysisItem4')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="weakness-analysis-page">
      <div className="analysis-header">
        <h1>{t('weakness.title')}</h1>
        <p>{t('weakness.subtitle')}</p>
        <div className="last-updated">
          {t('weakness.lastUpdated')}: {new Date(analysisData.lastUpdated).toLocaleString('ko-KR')}
        </div>
      </div>

      {/* 전체 통계 요약 */}
      <div className="overall-stats">
        <div className="stat-card main-stat">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.overallPercentage}%</div>
            <div className="stat-label">{t('weakness.overallAccuracy')}</div>
            <div className="stat-detail">
              {t('weakness.scoreDetail', { correct: analysisData.totalCorrect, total: analysisData.totalQuestions })}
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.categoryAnalysis.length}</div>
            <div className="stat-label">{t('weakness.categories')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.weakestCategories.length}</div>
            <div className="stat-label">{t('weakness.weakAreas')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-number">{analysisData.repeatedErrors.length}</div>
            <div className="stat-label">{t('weakness.repeatedErrors')}</div>
          </div>
        </div>
      </div>

      {/* 카테고리별 분석 */}
      <div className="category-analysis">
        <h2>{t('weakness.categoryPerformance')}</h2>
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
                    <span>{t('weakness.correct')}: {category.correct} / {t('weakness.incorrect')}: {category.incorrect} / {t('weakness.total', { count: category.total })}</span>
                  </div>
                </div>
                
                <div className="category-actions">
                  <button 
                    className="weakness-level"
                    style={{ backgroundColor: weakness.color }}
                  >
                    {t(`weakness.level.${weakness.levelKey}`)}
                  </button>
                  
                  {category.incorrect > 0 && (
                    <button 
                      className="study-weak-btn"
                      onClick={() => startWeaknessQuiz(category.category)}
                    >
                      {t('weakness.improveWeakness')}
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
          <h2>{t('weakness.recentErrors')}</h2>
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
            {t('weakness.studyRecentErrors')}
          </button>
        </div>
      )}

      {/* 반복 실수 문제들 */}
      {analysisData.repeatedErrors.length > 0 && (
        <div className="repeated-errors">
          <h2>{t('weakness.repeatedErrorsTitle')}</h2>
          <p className="section-description">
            {t('weakness.repeatedErrorsDesc')}
          </p>
          <div className="repeated-error-list">
            {analysisData.repeatedErrors.map((question, index) => (
              <div key={index} className="repeated-error-item">
                <div className="error-badge">
                  {t('weakness.errorCount', { count: question.errorCount })}
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
        <h2>{t('weakness.recommendations')}</h2>
        <div className="recommendation-list">
          {analysisData.weakestCategories.length > 0 && (
            <div className="recommendation-item">
              <div className="rec-icon">⚠️</div>
              <div className="rec-content">
                <h4>{t('weakness.recWeakAreas')}</h4>
                <p>
                  {t('weakness.recWeakAreasDesc', { areas: analysisData.weakestCategories.map(cat => cat.category).join(', ') })}
                </p>
              </div>
            </div>
          )}
          {analysisData.repeatedErrors.length > 0 && (
            <div className="recommendation-item">
              <div className="rec-icon">🔄</div>
              <div className="rec-content">
                <h4>{t('weakness.recRepeatedErrors')}</h4>
                <p>
                  {t('weakness.recRepeatedErrorsDesc')}
                </p>
              </div>
            </div>
          )}
          {analysisData.overallPercentage < 80 && (
            <div className="recommendation-item">
              <div className="rec-icon">📈</div>
              <div className="rec-content">
                <h4>{t('weakness.recOverallImprovement')}</h4>
                <p>
                  {t('weakness.recOverallImprovementDesc')}
                </p>
              </div>
            </div>
          )}
          {analysisData.overallPercentage >= 80 && analysisData.weakestCategories.length === 0 && analysisData.repeatedErrors.length === 0 && (
            <div className="recommendation-item">
              <div className="rec-icon">🌟</div>
              <div className="rec-content">
                <h4>{t('weakness.recExcellent')}</h4>
                <p>{t('weakness.recExcellentDesc')}</p>
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
