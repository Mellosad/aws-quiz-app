import React, { useState, useEffect, useCallback } from 'react';
import '../styles/DumpSelector.css';
import { useTranslation } from 'react-i18next';

function DumpSelector({ onDumpSelect }) {
  const [dumps, setDumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDump, setSelectedDump] = useState(null);
  const [questionCount, setQuestionCount] = useState(65);
  const [maxQuestions, setMaxQuestions] = useState(65);

  const loadMultipleDumps = useCallback(async () => {
    // 덤프 설정 파일 로드
    const configResponse = await fetch('/data/dumps-config.json');
    if (!configResponse.ok) {
      throw new Error('dumps-config.json 파일을 찾을 수 없습니다');
    }
    
    const config = await configResponse.json();
    const enabledDumps = config.dumps.filter(dump => dump.enabled);
    
    // 각 덤프 파일 로드
    const dumpPromises = enabledDumps.map(async (dumpConfig) => {
      try {
        const response = await fetch(`/data/${dumpConfig.filename}`);
        if (!response.ok) {
          console.warn(`덤프 파일 로드 실패: ${dumpConfig.filename}`);
          return null;
        }
        
        const dumpData = await response.json();
        return {
          ...dumpData,
          featured: dumpConfig.featured,
          questionCount: dumpData.totalQuestions || dumpData.questions?.length || 0
        };
      } catch (error) {
        console.error(`덤프 ${dumpConfig.filename} 로드 실패:`, error);
        return null;
      }
    });

    const loadedDumps = await Promise.all(dumpPromises);
    const validDumps = loadedDumps.filter(dump => dump !== null);
    
    if (validDumps.length === 0) {
      throw new Error('로드할 수 있는 덤프가 없습니다');
    }
    
    // featured 덤프를 맨 앞으로 정렬
    validDumps.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
    
    setDumps(validDumps);
    console.log(`다중 덤프 로드 완료: ${validDumps.length}개`);
  }, []);

  const loadDumps = useCallback(async () => {
    try {
      console.log('덤프 로드 시작...');
      
      // 먼저 기존 방식으로 시도
      let response = await fetch('/data/aws-dumps.json');
      
      if (response.ok) {
        console.log('기존 aws-dumps.json 파일 발견');
        const data = await response.json();
        
        if (data.dumps && Array.isArray(data.dumps)) {
          // 기존 형식: { dumps: [...] }
          setDumps(data.dumps.map(dump => ({
            ...dump,
            questionCount: dump.questionCount || dump.questions?.length || 0,
            featured: true
          })));
          console.log('기존 형식으로 덤프 로드 완료:', data.dumps.length);
        } else {
          throw new Error('잘못된 덤프 파일 형식');
        }
      } else {
        // 새로운 다중 덤프 방식으로 시도
        console.log('새로운 다중 덤프 방식으로 시도...');
        await loadMultipleDumps();
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('덤프 로드 실패:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [loadMultipleDumps]);

  useEffect(() => {
    loadDumps();
  }, [loadDumps]);

  const handleDumpClick = useCallback((dump) => {
    console.log('덤프 선택됨:', dump);
    setSelectedDump(dump);
    const maxQuestionCount = dump.questionCount || 126;
    setMaxQuestions(maxQuestionCount);
    setQuestionCount(Math.min(65, maxQuestionCount));
    setShowModal(true);
  }, []);

  const handleStartQuiz = useCallback(() => {
    const dumpWithSettings = {
      ...selectedDump,
      selectedQuestionCount: questionCount
    };
    console.log('퀴즈 시작:', dumpWithSettings);
    setShowModal(false);
    onDumpSelect(dumpWithSettings);
  }, [selectedDump, questionCount, onDumpSelect]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedDump(null);
  }, []);

  const getCategoryColor = useCallback((category) => {
    switch (category?.toLowerCase()) {
      case 'foundational': return '#4ECDC4';
      case 'associate': return '#4A90E2';
      case 'professional': return '#FF6B35';
      case 'specialty': return '#9B59B6';
      default: return '#4A90E2';
    }
  }, []);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case '초급': return '#00E676';
      case '중급': return '#FF8A00';
      case '고급': return '#FF4444';
      default: return '#FF8A00';
    }
  }, []);

  const handleQuickSelect = useCallback((targetCount) => {
    setQuestionCount(Math.min(targetCount, maxQuestions));
  }, [maxQuestions]);

  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="dump-selector">
        <div className="loading">
          <div className="loading-spinner">��</div>
          <p>{t('dump.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dump-selector">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>{t('error.loadFailed')}</h3>
          <p className="error-message">{error}</p>
          <div className="troubleshooting">
            <h4>{t('error.solution')}</h4>
            <ul>
              <li>{t('error.checkFile')}</li>
              <li>{t('error.checkSyntax')}</li>
              <li>{t('error.refresh')}</li>
            </ul>
          </div>
          <button onClick={loadDumps} className="retry-btn">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (dumps.length === 0) {
    return (
      <div className="dump-selector">
        <div className="no-dumps">
          <div className="empty-icon">📚</div>
          <h3>{t('dump.noDumps')}</h3>
          <p>{t('dump.noDumpsGuide')}</p>
          <div className="setup-guide">
            <h4>{t('dump.setupGuide')}</h4>
            <ol>
              <li>{t('dump.setupStep1')}</li>
              <li>{t('dump.setupStep2')}</li>
              <li>{t('dump.setupStep3')}</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dump-selector">
      <div className="page-header">
        <h1>{t('dump.title')}</h1>
        <p>{t('dump.subtitle')}</p>
        <div className="dumps-summary">
          {t('dump.summary', { dumpCount: dumps.length, questionCount: dumps.reduce((total, dump) => total + (dump.questionCount || 0), 0) })}
        </div>
      </div>
      
      <div className="dumps-grid">
        {dumps.map((dump, index) => (
          <div 
            key={dump.id || index} 
            className={`dump-card ${dump.featured ? 'featured' : ''}`}
            onClick={() => handleDumpClick(dump)}
          >
            {dump.featured && <div className="featured-badge">{t('dump.featured')}</div>}
            
            <div className="dump-card-header">
              <h3>{dump.title || t('dump.noTitle')}</h3>
              <div className="badges">
                {dump.category && (
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(dump.category) }}
                  >
                    {dump.category}
                  </span>
                )}
                {dump.difficulty && (
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(dump.difficulty) }}
                  >
                    {dump.difficulty}
                  </span>
                )}
              </div>
            </div>
            
            <p className="dump-description">
              {dump.description || t('dump.defaultDescription')}
            </p>
            
            <div className="dump-stats">
              <div className="stat-item">
                <span className="stat-icon">📝</span>
                <span className="stat-text">{dump.questionCount || 0}{t('dump.questions')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🎯</span>
                <span className="stat-text">{dump.difficulty || '중급'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📋</span>
                <span className="stat-text">{dump.category || 'Associate'}</span>
              </div>
            </div>
            
            <button className="start-button">
              {t('dump.selectQuestions')} →
            </button>
          </div>
        ))}
      </div>

      {/* 문항 수 선택 모달 */}
      {showModal && selectedDump && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🎯 {t('dump.selectQuestions')}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="dump-info">
                <h3>{selectedDump.title}</h3>
                <div className="modal-badges">
                  {selectedDump.category && (
                    <span 
                      className="modal-badge category"
                      style={{ backgroundColor: getCategoryColor(selectedDump.category) }}
                    >
                      {selectedDump.category}
                    </span>
                  )}
                  {selectedDump.difficulty && (
                    <span 
                      className="modal-badge difficulty"
                      style={{ backgroundColor: getDifficultyColor(selectedDump.difficulty) }}
                    >
                      {selectedDump.difficulty}
                    </span>
                  )}
                </div>
                <p>{t('dump.totalQuestions', { count: selectedDump.questionCount || 0 })}</p>
              </div>
              
              <div className="question-count-selector">
                <label>
                  <span className="slider-label">문항 수: {questionCount}문제</span>
                  <div className="slider-container">
                    <span className="slider-min">1</span>
                    <input
                      type="range"
                      min="1"
                      max={maxQuestions}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="question-slider"
                    />
                    <span className="slider-max">{maxQuestions}</span>
                  </div>
                </label>
              </div>
              
              <div className="quick-select">
                <span className="quick-select-label">빠른 선택:</span>
                <div className="quick-buttons">
                  <button 
                    onClick={() => handleQuickSelect(10)}
                    className={questionCount === Math.min(10, maxQuestions) ? 'quick-btn active' : 'quick-btn'}
                  >
                    {t('dump.questions10')}
                  </button>
                  <button 
                    onClick={() => handleQuickSelect(25)}
                    className={questionCount === Math.min(25, maxQuestions) ? 'quick-btn active' : 'quick-btn'}
                  >
                    {t('dump.questions25')}
                  </button>
                  <button 
                    onClick={() => handleQuickSelect(50)}
                    className={questionCount === Math.min(50, maxQuestions) ? 'quick-btn active' : 'quick-btn'}
                  >
                    {t('dump.questions50')}
                  </button>
                  <button 
                    onClick={() => handleQuickSelect(maxQuestions)}
                    className={questionCount === maxQuestions ? 'quick-btn active' : 'quick-btn'}
                  >
                    {t('dump.questionsAll')}
                  </button>
                </div>
              </div>
              
              <div className="estimated-time">
                <span>⏱️ {t('dump.estimatedTime', { time: Math.ceil(questionCount * 1.5) })}</span>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCloseModal}>
                {t('common.cancel')}
              </button>
              <button className="start-quiz-btn" onClick={handleStartQuiz}>
                {t('dump.startQuiz')} 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DumpSelector;
