import React, { useState, useEffect } from 'react';
import '../styles/BookmarksPage.css';

function BookmarksPage({ onStartBookmarkQuiz }) {
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarkedQuestions();
  }, []);

  const loadBookmarkedQuestions = async () => {
    try {
      // 북마크된 문제 ID들 가져오기
      const savedBookmarks = localStorage.getItem('bookmarkedQuestions');
      const bookmarkIds = savedBookmarks ? JSON.parse(savedBookmarks) : [];

      if (bookmarkIds.length === 0) {
        setLoading(false);
        return;
      }

      // JSON 파일에서 전체 문제 데이터 로드
      const response = await fetch('/data/aws-dumps.json');
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
      setLoading(false);
    }
  };

  const removeBookmark = (questionId) => {
    // 북마크에서 제거
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedQuestions') || '[]');
    const updatedBookmarks = savedBookmarks.filter(id => id !== questionId);
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(updatedBookmarks));
    
    // 상태 업데이트
    setBookmarkedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const clearAllBookmarks = () => {
    if (window.confirm('모든 북마크를 삭제하시겠습니까?')) {
      localStorage.removeItem('bookmarkedQuestions');
      setBookmarkedQuestions([]);
    }
  };

  const startBookmarkQuiz = () => {
    if (bookmarkedQuestions.length > 0) {
      onStartBookmarkQuiz(bookmarkedQuestions);
    }
  };

  if (loading) {
    return (
      <div className="bookmarks-page">
        <div className="loading">북마크 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <div className="header-content">
          <h1>⭐ 북마크한 문제</h1>
          <p>중요하다고 표시한 문제들을 관리하세요</p>
        </div>
        <div className="header-actions">
          {bookmarkedQuestions.length > 0 && (
            <>
              <button className="quiz-start-btn" onClick={startBookmarkQuiz}>
                🎯 북마크 퀴즈 시작
              </button>
              <button className="clear-all-btn" onClick={clearAllBookmarks}>
                🗑️ 전체 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="empty-bookmarks">
          <div className="empty-icon">📖</div>
          <h3>북마크한 문제가 없습니다</h3>
          <p>퀴즈를 풀면서 중요한 문제에 별표(⭐)를 눌러 북마크해보세요!</p>
          <div className="empty-tips">
            <h4>💡 북마크 활용 팁</h4>
            <ul>
              <li>어려웠던 문제는 북마크해서 나중에 다시 풀어보세요</li>
              <li>헷갈리는 개념이 나온 문제를 북마크하세요</li>
              <li>시험 직전 마지막 점검용으로 활용하세요</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bookmarks-content">
          <div className="bookmarks-summary">
            <div className="summary-card">
              <div className="summary-number">{bookmarkedQuestions.length}</div>
              <div className="summary-label">북마크된 문제</div>
            </div>
          </div>

          <div className="bookmarks-list">
            {bookmarkedQuestions.map((question, index) => (
              <div key={question.id} className="bookmark-item">
                <div className="bookmark-header">
                  <div className="question-info">
                    <span className="question-number">Q{question.id}</span>
                    <span className="question-type">
                      {question.type === 'multiple' ? 
                        `복수 선택 (${question.requiredSelections || 2}개)` : 
                        '단일 선택'
                      }
                    </span>
                  </div>
                  <button 
                    className="remove-bookmark-btn"
                    onClick={() => removeBookmark(question.id)}
                    title="북마크 제거"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="question-content">
                  <h3 className="question-text">{question.question}</h3>
                  
                  <div className="options-preview">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="option-preview">
                        <span className="option-label">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="answer-preview">
                    <strong>정답: </strong>
                    <span className="correct-answer">
                      {Array.isArray(question.correctAnswer) 
                        ? question.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')
                        : String.fromCharCode(65 + question.correctAnswer)
                      }
                    </span>
                  </div>
                  
                  {question.explanation && (
                    <div className="explanation-preview">
                      <strong>해설: </strong>
                      <span>{question.explanation.substring(0, 150)}
                        {question.explanation.length > 150 && '...'}
                      </span>
                    </div>
                  )}
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
