import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import '../styles/Layout.css';

function Layout({ children, currentPage, onNavigate, hasActiveQuiz, onNavigateToQuiz }) {
  const { toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();

  const handleQuizNavigation = () => {
    if (hasActiveQuiz) {
      onNavigateToQuiz();
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>{t('app.title', 'AWS Quiz')}</h2>
          <div className="header-controls">
            <LanguageSwitcher />
            <button 
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={t(isDark ? 'theme.light' : 'theme.dark') + t('theme.switch')}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={currentPage === 'dump-selector' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('dump-selector')}
          >
            📚 {t('nav.dumpSelector')}
          </button>
          <button 
            className={`nav-item ${currentPage === 'quiz' ? 'active' : ''} ${!hasActiveQuiz ? 'disabled' : ''}`}
            onClick={handleQuizNavigation}
            disabled={!hasActiveQuiz}
          >
            ❓ {t('nav.quiz')}
            {hasActiveQuiz && <span className="quiz-indicator">●</span>}
          </button>
          <button 
            className={currentPage === 'search' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('search')}
          >
            🔍 {t('nav.search')}
          </button>
          <button 
            className={currentPage === 'bookmarks' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('bookmarks')}
          >
            ⭐ {t('nav.bookmarks')}
          </button>
          <button 
            className={currentPage === 'weakness' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('weakness')}
          >
            📈 {t('nav.weakness')}
          </button>
          <button 
            className={currentPage === 'history' ? 'nav-item active' : 'nav-item'}
            onClick={() => onNavigate('history')}
          >
            📊 {t('nav.history')}
          </button>
        </nav>
      </div>
      
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default Layout;
