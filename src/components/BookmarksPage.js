import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/BookmarksPage.css';

function BookmarksPage({ onStartBookmarkQuiz }) {
  const { t } = useTranslation();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 해설 더보기/접기 상태 관리
  const [expandedExplanations, setExpandedExplanations] = useState({});

  // 북마크된 문제 로드 함수를 useCallback으로 최적화
  const loadBookmarkedQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 북마크된 문제 ID들 가져오기
      const savedBookmarks = localStorage.getItem('bookmarkedQuestions');
      const bookmarkIds = savedBookmarks ? JSON.parse(savedBookmarks) : [];

      if (bookmarkIds.length === 0) {
        setBookmarkedQuestions([]);
        setLoading(false);
        return;
      }

      // JSON 파일에서 전체 문제 데이터 로드
      const response = await fetch('/data/aws-dumps.json');
      
      if (!response.ok) {
        throw new Error(t('error.fileNotFound'));
      }

      const data = await response.json();
      const allQuestionsFromDump = data.dumps[0].questions || [];

      // 북마크된 문제들만 필터링
      const bookmarked = allQuestionsFromDump.filter(question => 
        bookmarkIds.includes(question.id)
      );

      setBookmarkedQuestions(bookmarked);
      setLoading(false);
    } catch (error) {
      console.error('북마크 데이터 로드 실패:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadBookmarkedQuestions();
  }, [loadBookmarkedQuestions]);

  // 개별 북마크 제거
  const removeBookmark = useCallback((questionId) => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedQuestions') || '[]');
    const updatedBookmarks = savedBookmarks.filter(id => id !== questionId);
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(updatedBookmarks));
    
    setBookmarkedQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  // 모든 북마크 삭제
  const clearAllBookmarks = useCallback(() => {
    if (window.confirm(t('bookmarks.confirmClearAll'))) {
      localStorage.removeItem('bookmarkedQuestions');
      setBookmarkedQuestions([]);
    }
  }, [t]);

  // 북마크 퀴즈 시작
  const startBookmarkQuiz = useCallback(() => {
    if (bookmarkedQuestions.length > 0) {
      onStartBookmarkQuiz(bookmarkedQuestions);
    }
  }, [bookmarkedQuestions, onStartBookmarkQuiz]);

  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          if (bookmarkedQuestions.length > 0) {
            startBookmarkQuiz();
          }
          break;
        case 'delete':
        case 'backspace':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            clearAllBookmarks();
          }
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            loadBookmarkedQuestions();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [bookmarkedQuestions.length, startBookmarkQuiz, clearAllBookmarks, loadBookmarkedQuestions]);

  // 해설 더보기/접기 토글 함수
  const toggleExplanation = (id) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="bookmarks-page">
        <div className="loading">
          <div className="loading-spinner">🔄</div>
          <p>{t('bookmarks.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookmarks-page">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>{t('error.loadFailed')}</h3>
          <p>{error}</p>
          <button onClick={loadBookmarkedQuestions} className="retry-btn" aria-label={t('common.retry')}>
            🔄 {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      {/* 키보드 단축키 안내 */}
      <div className="keyboard-shortcuts-hint">
        <span>{t('bookmarks.shortcuts')}: S({t('bookmarks.startQuiz')}) | Ctrl+Del({t('bookmarks.clearAll')}) | Ctrl+R({t('common.refresh')})</span>
      </div>

      <div className="bookmarks-header">
        <h1>{t('bookmarks.title')}</h1>
        <p>{t('bookmarks.subtitle')}</p>
        <div className="bookmarks-actions-row">
          <button 
            className="quiz-start-btn main-action" 
            onClick={startBookmarkQuiz}
            disabled={bookmarkedQuestions.length === 0}
            aria-label={t('bookmarks.startQuiz')}
          >
            🎯 {t('bookmarks.startQuiz')}
          </button>
          <button 
            className="clear-all-btn" 
            onClick={clearAllBookmarks}
            disabled={bookmarkedQuestions.length === 0}
            aria-label={t('bookmarks.clearAll')}
          >
            🗑️ {t('bookmarks.clearAll')}
          </button>
          <button 
            className="refresh-btn" 
            onClick={loadBookmarkedQuestions}
            aria-label={t('common.refresh')}
          >
            🔄 {t('common.refresh')}
          </button>
        </div>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="empty-bookmarks emphasized-empty">
          <div className="empty-icon">⭐</div>
          <h2>{t('bookmarks.empty')}</h2>
          <p className="empty-guide">{t('bookmarks.emptyGuide')}</p>
          <div className="empty-tips">
            <h4>{t('bookmarks.tips')}</h4>
            <ul>
              <li>{t('bookmarks.tip1')}</li>
              <li>{t('bookmarks.tip2')}</li>
              <li>{t('bookmarks.tip3')}</li>
            </ul>
          </div>
          <button 
            className="back-to-quiz-btn main-action"
            onClick={() => window.history.back()}
            aria-label={t('bookmarks.backToQuiz')}
          >
            📚 {t('bookmarks.backToQuiz')}
          </button>
        </div>
      ) : (
        <div className="bookmarks-content">
          <div className="bookmarks-summary">
            <div className="summary-card">
              <div className="summary-number">{bookmarkedQuestions.length}</div>
              <div className="summary-label">{t('bookmarks.count')}</div>
            </div>
          </div>

          <div className="bookmarks-list">
            {bookmarkedQuestions.map((question, index) => (
              <div key={question.id} className="bookmark-item card-style">
                <div className="bookmark-header">
                  <div className="question-info">
                    <span className="question-number">Q{question.id}</span>
                    <span className="question-type">
                      {question.type === 'multiple' ? 
                        t('bookmarks.multipleType', { count: question.requiredSelections || 2 }) : 
                        t('bookmarks.singleType')
                      }
                    </span>
                    <span className="bookmark-index">
                      {index + 1} / {bookmarkedQuestions.length}
                    </span>
                  </div>
                  <button 
                    className="remove-bookmark-btn"
                    onClick={() => removeBookmark(question.id)}
                    aria-label={t('bookmarks.remove')}
                  >
                    ✕
                  </button>
                </div>
                <div className="question-content">
                  <h3 className="question-text">{question.question}</h3>
                  <div className="options-preview">
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.includes(optionIndex)
                        : question.correctAnswer === optionIndex;
                      return (
                        <div 
                          key={optionIndex} 
                          className={`option-preview${isCorrect ? ' correct' : ''}`}
                          tabIndex={0}
                          aria-label={isCorrect ? t('bookmarks.answer') : undefined}
                        >
                          <span className="option-label">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="option-text">{option}</span>
                          {isCorrect && (
                            <span className="correct-indicator" aria-label={t('bookmarks.answer')}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="answer-preview">
                    <strong>{t('bookmarks.answer')}: </strong>
                    <span className="correct-answer">
                      {Array.isArray(question.correctAnswer) 
                        ? question.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')
                        : String.fromCharCode(65 + question.correctAnswer)
                      }
                    </span>
                  </div>
                  {question.explanation && (
                    <div className="explanation-preview">
                      <strong>{t('bookmarks.explanation')}: </strong>
                      <span className="explanation-text">
                        {question.explanation.length > 200 && !expandedExplanations[question.id]
                          ? (
                            <>
                              {question.explanation.substring(0, 200)}...
                              <button 
                                className="expand-btn"
                                onClick={() => toggleExplanation(question.id)}
                                aria-label={t('bookmarks.showMore')}
                              >
                                {t('bookmarks.showMore')}
                              </button>
                            </>
                          ) : (
                            <>
                              {question.explanation}
                              {question.explanation.length > 200 && (
                                <button 
                                  className="expand-btn"
                                  onClick={() => toggleExplanation(question.id)}
                                  aria-label={t('bookmarks.showLess')}
                                >
                                  {t('bookmarks.showLess')}
                                </button>
                              )}
                            </>
                          )}
                      </span>
                    </div>
                  )}
                  <div className="bookmark-meta">
                    <span className="bookmark-date">
                      {t('bookmarks.bookmarked')}: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;
