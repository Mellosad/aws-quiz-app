import React, { useState, useEffect, useCallback } from 'react';
import '../styles/SearchPage.css';
import { useTranslation } from 'react-i18next';

function SearchPage({ onStartSearchQuiz }) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchCategory, setSearchCategory] = useState('all');
  const { t } = useTranslation();

  useEffect(() => {
    loadAllQuestions();
  }, []);

  const filterQuestions = useCallback(() => {
    let filtered = allQuestions;

    // 카테고리 필터링
    if (searchCategory !== 'all') {
      filtered = filtered.filter(question => {
        const questionText = question.question.toLowerCase();
        switch (searchCategory) {
          case 'ec2':
            return questionText.includes('ec2') || questionText.includes('인스턴스');
          case 's3':
            return questionText.includes('s3') || questionText.includes('버킷');
          case 'vpc':
            return questionText.includes('vpc') || questionText.includes('네트워크');
          case 'rds':
            return questionText.includes('rds') || questionText.includes('데이터베이스');
          case 'lambda':
            return questionText.includes('lambda') || questionText.includes('함수');
          case 'multiple':
            return question.type === 'multiple';
          case 'single':
            return question.type === 'single' || !question.type;
          default:
            return true;
        }
      });
    }

    // 검색어 필터링
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(question =>
        question.question.toLowerCase().includes(term) ||
        question.options.some(option => option.toLowerCase().includes(term)) ||
        (question.explanation && question.explanation.toLowerCase().includes(term))
      );
    }

    setFilteredQuestions(filtered);
  }, [allQuestions, searchTerm, searchCategory]);

  useEffect(() => {
    filterQuestions();
  }, [filterQuestions]);

  const loadAllQuestions = async () => {
    try {
      const response = await fetch('/data/aws-dumps.json');
      const data = await response.json();
      
      const questions = data.dumps[0].questions || [];
      setAllQuestions(questions);
      setFilteredQuestions(questions);
      setLoading(false);
    } catch (error) {
      console.error('문제 데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAllFiltered = () => {
    const allIds = new Set(filteredQuestions.map(q => q.id));
    setSelectedQuestions(allIds);
  };

  const clearSelection = () => {
    setSelectedQuestions(new Set());
  };

  const startSelectedQuiz = () => {
    const selectedQuestionsArray = allQuestions.filter(q => selectedQuestions.has(q.id));
    if (selectedQuestionsArray.length > 0) {
      onStartSearchQuiz(selectedQuestionsArray);
    }
  };

  if (loading) {
    return (
      <div className="search-page">
        <div className="loading">문제 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>{t('search.title')}</h1>
        <p>{t('search.subtitle')}</p>
      </div>

      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="search-stats">
            {t('search.foundQuestions', { count: filteredQuestions.length })} | {t('search.selectedQuestions', { count: selectedQuestions.size })}
          </div>
        </div>

        <div className="category-filters">
          <select 
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">{t('search.allCategories')}</option>
            <option value="ec2">EC2</option>
            <option value="s3">S3</option>
            <option value="vpc">VPC</option>
            <option value="rds">RDS</option>
            <option value="lambda">Lambda</option>
            <option value="single">{t('search.singleChoice')}</option>
            <option value="multiple">{t('search.multipleChoice')}</option>
          </select>
        </div>

        <div className="selection-controls">
          <button onClick={selectAllFiltered} className="select-all-btn">
            {t('search.selectAll')}
          </button>
          <button onClick={clearSelection} className="clear-selection-btn">
            {t('search.clearSelection')}
          </button>
          {selectedQuestions.size > 0 && (
            <button onClick={startSelectedQuiz} className="start-selected-quiz-btn">
              {t('search.startQuiz', { count: selectedQuestions.size })}
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {filteredQuestions.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>검색 결과가 없습니다</h3>
            <p>다른 키워드로 검색해보세요</p>
          </div>
        ) : (
          <div className="questions-list">
            {filteredQuestions.map((question) => (
              <div 
                key={question.id} 
                className={`question-card ${selectedQuestions.has(question.id) ? 'selected' : ''}`}
                onClick={() => toggleQuestionSelection(question.id)}
              >
                <div className="question-header">
                  <div className="question-info">
                    <span className="question-number">Q{question.id}</span>
                    <span className="question-type">
                      {question.type === 'multiple' ? 
                        `복수 선택 (${question.requiredSelections || 2}개)` : 
                        '단일 선택'
                      }
                    </span>
                  </div>
                  <div className="selection-checkbox">
                    {selectedQuestions.has(question.id) ? '✅' : '☐'}
                  </div>
                </div>

                <div className="question-content">
                  <h3 className="question-text">{question.question}</h3>
                  
                  <div className="options-preview">
                    {question.options.map((option, index) => (
                      <div key={index} className="option-item">
                        <span className="option-label">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>

                  <div className="answer-info">
                    <strong>{t('search.answer')}</strong>
                    <span className="correct-answer">
                      {Array.isArray(question.correctAnswer) 
                        ? question.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')
                        : String.fromCharCode(65 + question.correctAnswer)
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
