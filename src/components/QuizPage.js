import React, { useState, useEffect, useCallback } from 'react';
import '../styles/QuizPage.css';

function QuizPage({ selectedDump, onBackToDumpSelector }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [solvedQuestions, setSolvedQuestions] = useState([]);

  // 퀴즈 진행상황을 로컬스토리지에 저장하는 키 - useCallback으로 감싸기
  const getProgressKey = useCallback(() => `quiz_progress_${selectedDump.id}`, [selectedDump.id]);

  // 진행상황 자동 저장
  const saveProgress = useCallback(() => {
    if (questions.length > 0) {
      const progressData = {
        currentQuestionIndex,
        selectedAnswers,
        showResult,
        score,
        solvedQuestions,
        timestamp: new Date().toISOString(),
        dumpInfo: selectedDump
      };
      localStorage.setItem(getProgressKey(), JSON.stringify(progressData));
    }
  }, [currentQuestionIndex, selectedAnswers, showResult, score, solvedQuestions, selectedDump, questions.length, getProgressKey]);

  // 진행상황 복원
  const loadProgress = useCallback(() => {
    const savedProgress = localStorage.getItem(getProgressKey());
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress);
        setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
        setSelectedAnswers(progressData.selectedAnswers || []);
        setShowResult(progressData.showResult || false);
        setScore(progressData.score || 0);
        setSolvedQuestions(progressData.solvedQuestions || []);
        console.log('퀴즈 진행상황 복원됨:', progressData);
      } catch (error) {
        console.error('진행상황 복원 실패:', error);
      }
    }
  }, [getProgressKey]);

  // 진행상황 삭제
  const clearProgress = useCallback(() => {
    localStorage.removeItem(getProgressKey());
  }, [getProgressKey]);

  // 배열 셔플 함수
  const shuffleArray = useCallback((array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  // 북마크 데이터 로드
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedQuestions');
    if (savedBookmarks) {
      setBookmarkedQuestions(new Set(JSON.parse(savedBookmarks)));
    }
  }, []);

  // 북마크 토글
  const toggleBookmark = useCallback((questionId) => {
    const newBookmarks = new Set(bookmarkedQuestions);
    if (newBookmarks.has(questionId)) {
      newBookmarks.delete(questionId);
    } else {
      newBookmarks.add(questionId);
    }
    setBookmarkedQuestions(newBookmarks);
    localStorage.setItem('bookmarkedQuestions', JSON.stringify([...newBookmarks]));
  }, [bookmarkedQuestions]);

  // JSON 파일에서 문제 데이터 로드
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // 북마크 모드인지 확인
        if (selectedDump.bookmarkMode) {
          const processedQuestions = selectedDump.bookmarkedQuestions.map(question => ({
            ...question,
            type: question.type || 'single'
          }));
          setQuestions(processedQuestions);
          console.log(`북마크된 ${processedQuestions.length}개 문제 로드됨`);
          return;
        }

        // 검색 모드인지 확인
        if (selectedDump.searchMode) {
          const processedQuestions = selectedDump.searchedQuestions.map(question => ({
            ...question,
            type: question.type || 'single'
          }));
          setQuestions(processedQuestions);
          console.log(`검색된 ${processedQuestions.length}개 문제 로드됨`);
          return;
        }

        // 약점 분석 모드인지 확인
        if (selectedDump.weaknessMode) {
          const processedQuestions = selectedDump.weaknessQuestions.map(question => ({
            ...question,
            type: question.type || 'single'
          }));
          setQuestions(processedQuestions);
          console.log(`약점 보완 ${processedQuestions.length}개 문제 로드됨`);
          return;
        }

        // 일반 모드 - aws-dumps.json 파일만 사용
        const response = await fetch('/data/aws-dumps.json');
        
        if (!response.ok) {
          console.log('JSON 파일 로드 실패, 상태 코드:', response.status);
          throw new Error('덤프 파일을 찾을 수 없습니다');
        }
        
        const data = await response.json();
        console.log('로드된 JSON 데이터:', data);
        
        const selectedDumpData = data.dumps.find(dump => dump.id === selectedDump.id);
        console.log('선택된 덤프 데이터:', selectedDumpData);
        
        if (selectedDumpData && selectedDumpData.questions) {
          const processedQuestions = selectedDumpData.questions.map(question => ({
            ...question,
            type: question.type || 'single'
          }));
          
          const shuffledQuestions = shuffleArray(processedQuestions);
          const selectedQuestions = shuffledQuestions.slice(0, selectedDump.selectedQuestionCount);
          
          setQuestions(selectedQuestions);
          console.log(`총 ${processedQuestions.length}개 문제 중 ${selectedDump.selectedQuestionCount}개 선택됨`);
        } else {
          throw new Error('선택된 덤프의 문제를 찾을 수 없습니다');
        }
      } catch (error) {
        console.error('문제 데이터 로드 실패:', error);
        setQuestions([]);
      }
    };

    if (selectedDump) {
      loadQuestions();
    }
  }, [selectedDump, shuffleArray]);

  // 문제가 로드된 후 진행상황 복원
  useEffect(() => {
    if (questions.length > 0) {
      loadProgress();
    }
  }, [questions, loadProgress]);

  // 진행상황이 변경될 때마다 자동 저장
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // 문제 카테고리 자동 분류 함수
  const getQuestionCategory = useCallback((questionText) => {
    const text = questionText.toLowerCase();
    if (text.includes('ec2') || text.includes('인스턴스')) return 'EC2';
    if (text.includes('s3') || text.includes('버킷')) return 'S3';
    if (text.includes('vpc') || text.includes('네트워크')) return 'VPC';
    if (text.includes('rds') || text.includes('데이터베이스')) return 'RDS';
    if (text.includes('lambda') || text.includes('함수')) return 'Lambda';
    if (text.includes('iam') || text.includes('권한')) return 'IAM';
    if (text.includes('cloudformation')) return 'CloudFormation';
    if (text.includes('cloudwatch')) return 'CloudWatch';
    if (text.includes('route 53') || text.includes('dns')) return 'Route 53';
    if (text.includes('elb') || text.includes('로드')) return 'Load Balancer';
    if (text.includes('sagemaker') || text.includes('머신러닝')) return 'AI/ML';
    if (text.includes('comprehend') || text.includes('인공지능')) return 'AI/ML';
    if (text.includes('billing') || text.includes('비용')) return 'Billing';
    if (text.includes('support') || text.includes('지원')) return 'Support';
    return 'General';
  }, []);

  const handleAnswerSelect = useCallback((answerIndex) => {
    if (currentQuestion.type === 'single') {
      setSelectedAnswers([answerIndex]);
    } else {
      setSelectedAnswers(prev => {
        const newAnswers = [...prev];
        const existingIndex = newAnswers.indexOf(answerIndex);
        
        if (existingIndex > -1) {
          newAnswers.splice(existingIndex, 1);
        } else {
          const maxSelections = currentQuestion.requiredSelections || 2;
          if (newAnswers.length < maxSelections) {
            newAnswers.push(answerIndex);
          } else {
            newAnswers.shift();
            newAnswers.push(answerIndex);
          }
        }
        
        return newAnswers.sort((a, b) => a - b);
      });
    }
  }, [currentQuestion]);

  const handleCheckAnswer = useCallback(() => {
    setShowResult(true);
    
    let isCorrect = false;
    
    if (currentQuestion.type === 'single') {
      isCorrect = selectedAnswers[0] === currentQuestion.correctAnswer;
    } else {
      const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
        ? [...currentQuestion.correctAnswer].sort((a, b) => a - b)
        : [currentQuestion.correctAnswer];
      
      const userAnswers = [...selectedAnswers].sort((a, b) => a - b);
      
      isCorrect = correctAnswers.length === userAnswers.length && 
                  correctAnswers.every((answer, index) => answer === userAnswers[index]);
    }
    
    if (isCorrect) {
      setScore(score + 1);
    }

    const questionRecord = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswers: selectedAnswers,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: isCorrect,
      timestamp: new Date().toISOString(),
      explanation: currentQuestion.explanation,
      category: getQuestionCategory(currentQuestion.question),
      dumpId: selectedDump.id
    };
    
    setSolvedQuestions(prev => [...prev, questionRecord]);
  }, [currentQuestion, selectedAnswers, score, getQuestionCategory, selectedDump.id]);

  // 카테고리별 통계 생성
  const generateCategoryStats = useCallback((questions) => {
    const categoryData = {};
    
    questions.forEach(q => {
      const category = q.category;
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, correct: 0 };
      }
      categoryData[category].total++;
      if (q.isCorrect) {
        categoryData[category].correct++;
      }
    });
    
    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      total: data.total,
      correct: data.correct,
      percentage: Math.round((data.correct / data.total) * 100)
    }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    } else {
      let finalScore = score;
      
      if (currentQuestion.type === 'single') {
        if (selectedAnswers[0] === currentQuestion.correctAnswer) finalScore++;
      } else {
        const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
          ? [...currentQuestion.correctAnswer].sort((a, b) => a - b)
          : [currentQuestion.correctAnswer];
        
        const userAnswers = [...selectedAnswers].sort((a, b) => a - b);
        
        if (correctAnswers.length === userAnswers.length && 
            correctAnswers.every((answer, index) => answer === userAnswers[index])) {
          finalScore++;
        }
      }

      const lastQuestionRecord = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        userAnswers: selectedAnswers,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: currentQuestion.type === 'single' ? 
          selectedAnswers[0] === currentQuestion.correctAnswer :
          JSON.stringify([...selectedAnswers].sort()) === JSON.stringify([...(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer])].sort()),
        timestamp: new Date().toISOString(),
        explanation: currentQuestion.explanation,
        category: getQuestionCategory(currentQuestion.question),
        dumpId: selectedDump.id
      };
      
      const finalSolvedQuestions = [...solvedQuestions, lastQuestionRecord];
      
      const quizRecord = {
        dumpId: selectedDump.id,
        dumpTitle: selectedDump.title,
        totalQuestions: totalQuestions,
        finalScore: finalScore,
        percentage: Math.round((finalScore / totalQuestions) * 100),
        completedAt: new Date().toISOString(),
        questions: finalSolvedQuestions,
        categoryStats: generateCategoryStats(finalSolvedQuestions)
      };
      
      const existingRecords = JSON.parse(localStorage.getItem('quizRecords') || '[]');
      existingRecords.push(quizRecord);
      localStorage.setItem('quizRecords', JSON.stringify(existingRecords));
      
      // 퀴즈 완료 시 진행상황 삭제
      clearProgress();
      
      onBackToDumpSelector(quizRecord);
    }
  }, [currentQuestionIndex, totalQuestions, currentQuestion, selectedAnswers, score, solvedQuestions, selectedDump, onBackToDumpSelector, clearProgress, getQuestionCategory, generateCategoryStats]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswers([]);
      setShowResult(false);
    }
  }, [currentQuestionIndex]);

  const canSubmitAnswer = useCallback(() => {
    if (currentQuestion && currentQuestion.type === 'single') {
      return selectedAnswers.length === 1;
    } else if (currentQuestion) {
      return selectedAnswers.length === (currentQuestion.requiredSelections || 2);
    }
    return false;
  }, [currentQuestion, selectedAnswers]);

  // 키보드 단축키 이벤트 핸들러
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();
      
      switch (key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault();
          if (!showResult && currentQuestion) {
            const answerIndex = parseInt(key) - 1;
            if (answerIndex < currentQuestion.options.length) {
              handleAnswerSelect(answerIndex);
            }
          }
          break;
        
        case ' ':
          event.preventDefault();
          if (!showResult && canSubmitAnswer()) {
            handleCheckAnswer();
          }
          break;
        
        case 'enter':
          event.preventDefault();
          if (showResult) {
            handleNextQuestion();
          }
          break;
        
        case 'b':
          event.preventDefault();
          if (currentQuestion) {
            toggleBookmark(currentQuestion.id);
          }
          break;
        
        case 'arrowleft':
          event.preventDefault();
          if (currentQuestionIndex > 0) {
            handlePrevQuestion();
          }
          break;
        
        case 'arrowright':
          event.preventDefault();
          if (showResult && currentQuestionIndex < totalQuestions - 1) {
            handleNextQuestion();
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
  }, [showResult, currentQuestion, currentQuestionIndex, totalQuestions, canSubmitAnswer, handleAnswerSelect, handleCheckAnswer, handleNextQuestion, handlePrevQuestion, toggleBookmark]);

  const getOptionClassName = (optionIndex) => {
    const baseClass = 'option-button';
    const isSelected = selectedAnswers.includes(optionIndex);
    
    if (!showResult) {
      return `${baseClass} ${isSelected ? 'selected' : ''}`;
    }
    
    if (currentQuestion.type === 'single') {
      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      if (isSelected && !isCorrect) return `${baseClass} selected incorrect`;
      if (isCorrect) return `${baseClass} correct`;
    } else {
      const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
        ? currentQuestion.correctAnswer 
        : [currentQuestion.correctAnswer];
      
      const isCorrect = correctAnswers.includes(optionIndex);
      if (isSelected && !isCorrect) return `${baseClass} selected incorrect`;
      if (isSelected && isCorrect) return `${baseClass} selected correct`;
      if (!isSelected && isCorrect) return `${baseClass} correct`;
    }
    
    return `${baseClass} ${isSelected ? 'selected' : ''}`;
  };

  // 퀴즈 종료 시 진행상황 삭제
  const handleQuitQuiz = useCallback(() => {
    clearProgress();
    onBackToDumpSelector();
  }, [clearProgress, onBackToDumpSelector]);

  if (!selectedDump || questions.length === 0) {
    return (
      <div className="quiz-page">
        <div className="loading">문제를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* 키보드 단축키 안내 */}
      <div className="keyboard-shortcuts-hint">
        <span>⌨️ 단축키: 1-5(선택지) | 스페이스(정답확인) | Enter(다음) | B(북마크) | ← →(이동)</span>
      </div>

      <div className="quiz-header">
        <div className="quiz-info">
          <h1>{selectedDump.title}</h1>
          <div className="progress-info">
            <span>문제 {currentQuestionIndex + 1} / {totalQuestions}</span>
            <span>점수: {score}/{totalQuestions}</span>
            <span className="selected-count">📋 선택: {selectedDump.selectedQuestionCount}문제</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`bookmark-btn ${bookmarkedQuestions.has(currentQuestion?.id) ? 'bookmarked' : ''}`}
            onClick={() => toggleBookmark(currentQuestion?.id)}
            title="북마크 추가/제거 (B키)"
          >
            {bookmarkedQuestions.has(currentQuestion?.id) ? '⭐' : '☆'}
          </button>
          <button className="back-button" onClick={handleQuitQuiz}>
            ← 덤프 선택으로 돌아가기
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
        ></div>
      </div>

      <div className="question-container">
        <div className="question-header">
          <h2>
            Q{currentQuestionIndex + 1}. {currentQuestion.question}
            {currentQuestion.type === 'multiple' && (
              <span className="question-type-indicator">
                {" "}({currentQuestion.requiredSelections || 2}개 선택)
              </span>
            )}
          </h2>
          {currentQuestion.type === 'multiple' && (
            <div className="question-hint">
              <span className="selection-info">
                {selectedAnswers.length}/{currentQuestion.requiredSelections || 2} 선택됨
                {selectedAnswers.length < (currentQuestion.requiredSelections || 2) && 
                  ` - ${(currentQuestion.requiredSelections || 2) - selectedAnswers.length}개 더 선택하세요`
                }
              </span>
            </div>
          )}
        </div>

        <div className="options-container">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClassName(index)}
              onClick={() => !showResult && handleAnswerSelect(index)}
              disabled={showResult}
            >
              <span className="option-indicator">
                {currentQuestion.type === 'single' ? (
                  <span className="radio-indicator">●</span>
                ) : (
                  <span className="checkbox-indicator">
                    {selectedAnswers.includes(index) ? '✓' : '□'}
                  </span>
                )}
              </span>
              <span className="option-label">{String.fromCharCode(65 + index)}.</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        {showResult && (
          <div className="result-container">
            <div className={`result-badge ${
              (currentQuestion.type === 'single' ? 
                selectedAnswers[0] === currentQuestion.correctAnswer :
                JSON.stringify([...selectedAnswers].sort()) === JSON.stringify([...(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer])].sort())
              ) ? 'correct' : 'incorrect'
            }`}>
              {(currentQuestion.type === 'single' ? 
                selectedAnswers[0] === currentQuestion.correctAnswer :
                JSON.stringify([...selectedAnswers].sort()) === JSON.stringify([...(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer])].sort())
              ) ? '✅정답!' : '❌오답!'}
            </div>
            <div className="explanation">
              <h4>해설:</h4>
              <p>{currentQuestion.explanation}</p>
              {currentQuestion.type === 'multiple' && Array.isArray(currentQuestion.correctAnswer) && (
                <p><strong>정답:</strong> {currentQuestion.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')}</p>
              )}
            </div>
          </div>
        )}

        <div className="quiz-actions">
          <button 
            className="nav-button prev" 
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            ← 이전 문제
          </button>
          
          {!showResult ? (
            <button 
              className="check-button" 
              onClick={handleCheckAnswer}
              disabled={!canSubmitAnswer()}
            >
              정답 확인
            </button>
          ) : (
            <button 
              className="next-button" 
              onClick={handleNextQuestion}
            >
              {currentQuestionIndex < totalQuestions - 1 ? '다음 문제 →' : '퀴즈 완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
