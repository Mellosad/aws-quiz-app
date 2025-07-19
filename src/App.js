import React, { useState } from 'react';
import './App.css';
import Layout from './components/Layout';
import DumpSelector from './components/DumpSelector';
import QuizPage from './components/QuizPage';
import ResultsPage from './components/ResultsPage';
import BookmarksPage from './components/BookmarksPage';
import HistoryPage from './components/HistoryPage';
import SearchPage from './components/SearchPage';
import WeaknessAnalysisPage from './components/WeaknessAnalysisPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [currentPage, setCurrentPage] = useState('dump-selector');
  const [selectedDump, setSelectedDump] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const handleDumpSelect = (dump) => {
    setSelectedDump(dump);
    setCurrentPage('quiz');
  };

  const handleBackToDumpSelector = (result = null) => {
    if (result) {
      setQuizResult(result);
      setCurrentPage('results');
    } else {
      setCurrentPage('dump-selector');
      setSelectedDump(null);
      setQuizResult(null);
    }
  };

  const handleBackFromResults = () => {
    setCurrentPage('dump-selector');
    setSelectedDump(null);
    setQuizResult(null);
  };

  const handleNavigateToQuiz = () => {
    if (selectedDump) {
      setCurrentPage('quiz');
    }
  };

  const handleStartBookmarkQuiz = (bookmarkedQuestions) => {
    const bookmarkDump = {
      id: 'bookmarks',
      title: '북마크한 문제',
      selectedQuestionCount: bookmarkedQuestions.length,
      bookmarkMode: true,
      bookmarkedQuestions: bookmarkedQuestions
    };
    setSelectedDump(bookmarkDump);
    setCurrentPage('quiz');
  };

  const handleStartSearchQuiz = (searchedQuestions) => {
    const searchDump = {
      id: 'search-results',
      title: '검색된 문제',
      selectedQuestionCount: searchedQuestions.length,
      searchMode: true,
      searchedQuestions: searchedQuestions
    };
    setSelectedDump(searchDump);
    setCurrentPage('quiz');
  };

  const handleStartWeaknessQuiz = (weaknessQuestions, category = null) => {
    const weaknessDump = {
      id: 'weakness-analysis',
      title: category ? `${category} 약점 보완` : '약점 보완 퀴즈',
      selectedQuestionCount: weaknessQuestions.length,
      weaknessMode: true,
      weaknessQuestions: weaknessQuestions
    };
    setSelectedDump(weaknessDump);
    setCurrentPage('quiz');
  };

  return (
    <ThemeProvider>
      <div className="App">
        <Layout 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          hasActiveQuiz={!!selectedDump}
          onNavigateToQuiz={handleNavigateToQuiz}
        >
          {currentPage === 'dump-selector' && (
            <DumpSelector onDumpSelect={handleDumpSelect} />
          )}
          {currentPage === 'quiz' && (
            <QuizPage 
              selectedDump={selectedDump} 
              onBackToDumpSelector={handleBackToDumpSelector}
            />
          )}
          {currentPage === 'results' && (
            <ResultsPage 
              quizResult={quizResult}
              onBackToDumpSelector={handleBackFromResults}
            />
          )}
          {currentPage === 'bookmarks' && (
            <BookmarksPage onStartBookmarkQuiz={handleStartBookmarkQuiz} />
          )}
          {currentPage === 'history' && (
            <HistoryPage />
          )}
          {currentPage === 'search' && (
            <SearchPage onStartSearchQuiz={handleStartSearchQuiz} />
          )}
          {currentPage === 'weakness' && (
            <WeaknessAnalysisPage onStartWeaknessQuiz={handleStartWeaknessQuiz} />
          )}
        </Layout>
      </div>
    </ThemeProvider>
  );
}

export default App;
