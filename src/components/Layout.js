import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Layout.css';

function Layout({ children, currentPage, onNavigate, hasActiveQuiz, onNavigateToQuiz }) {
  const { toggleTheme, isDark } = useTheme();

  const handleQuizNavigation = () => {
    if (hasActiveQuiz) {
      onNavigateToQuiz();
    }
  };

  return (
    <div className="layout">
      {/* 사이드바 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>AWS 퀴즈</h2>
          <button 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`${isDark ? '라이트' : '다크'} 모드로 전환`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={currentPage === 'dump-selector' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('dump-selector')}
          >
            📚 덤프 선택
          </button>
          <button 
            className={`nav-item ${currentPage === 'quiz' ? 'active' : ''} ${!hasActiveQuiz ? 'disabled' : ''}`}
            onClick={handleQuizNavigation}
            disabled={!hasActiveQuiz}
            title={hasActiveQuiz ? '퀴즈 페이지로 이동' : '먼저 덤프를 선택해주세요'}
          >
            ❓ 문제 풀이
            {hasActiveQuiz && <span className="quiz-indicator">●</span>}
          </button>
          <button 
            className={currentPage === 'search' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('search')}
          >
            🔍 문제 검색
          </button>
          <button 
            className={currentPage === 'bookmarks' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('bookmarks')}
          >
            ⭐ 북마크
          </button>
          <button 
            className={currentPage === 'weakness' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('weakness')}
          >
            📈 약점 분석
          </button>
          <button 
            className={currentPage === 'history' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('history')}
          >
            📊 학습 기록
          </button>
        </nav>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default Layout;
