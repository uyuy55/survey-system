// components/SurveyTaker.js - 增强版本
import React, { useState, useEffect } from 'react';
import QuestionRenderer from './QuestionRenderer';
import { fileUploadService } from '../utils/fileUploadService';
import { validateResponseCompleteness, validateResponseQuality } from '../utils/responseValidation';
import ValidationAlert from './ValidationAlert';
import './SurveyTaker.css';
import QualityAlert from './QualityAlert';

const SurveyTaker = ({ surveyData, onSubmit, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [questionHistory, setQuestionHistory] = useState([0]);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [startTime] = useState(Date.now()); // 记录开始时间
  const [qualityAlert, setQualityAlert] = useState({
    show: false,
    warnings: [],
    anomalies: []
  });

  // 从localStorage恢复未提交的答案
  useEffect(() => {
    const savedAnswers = localStorage.getItem('currentSurveyAnswers');
    const savedCurrentIndex = localStorage.getItem('currentQuestionIndex');
    const savedVisited = localStorage.getItem('visitedQuestions');
    
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
    if (savedCurrentIndex) {
      setCurrentQuestionIndex(parseInt(savedCurrentIndex));
    }
    if (savedVisited) {
      setVisitedQuestions(new Set(JSON.parse(savedVisited)));
    }
  }, []);

  // 保存当前状态到localStorage
  useEffect(() => {
    localStorage.setItem('currentSurveyAnswers', JSON.stringify(answers));
    localStorage.setItem('currentQuestionIndex', currentQuestionIndex.toString());
    localStorage.setItem('visitedQuestions', JSON.stringify([...visitedQuestions]));
  }, [answers, currentQuestionIndex, visitedQuestions]);

  // 获取当前问题
  const getCurrentQuestion = () => {
    return surveyData.questions[currentQuestionIndex];
  };

  // 处理文件上传
  const handleFileUpload = async (questionId, file) => {
    try {
      setUploadingFiles(prev => ({
        ...prev,
        [questionId]: true
      }));

      const fileInfo = await fileUploadService.uploadFile(file, questionId);
      
      if (fileInfo) {
        setAnswers(prev => ({
          ...prev,
          [questionId]: fileInfo
        }));
        
        if (errors[questionId]) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[questionId];
            return newErrors;
          });
        }
      } else {
        throw new Error('文件上传返回空值');
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [questionId]: error.message || '文件上传失败'
      }));
    } finally {
      setUploadingFiles(prev => ({
        ...prev,
        [questionId]: false
      }));
    }
  };

  // 处理答案变化
  const handleAnswerChange = (questionId, answer) => {
    const currentQuestion = getCurrentQuestion();
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }

    // 检查逻辑跳转
    if (currentQuestion.type === 'radio' && currentQuestion.logic) {
      const jumpToQuestionId = currentQuestion.logic[answer];
      if (jumpToQuestionId) {
        const targetIndex = surveyData.questions.findIndex(q => q.id === jumpToQuestionId);
        if (targetIndex !== -1 && targetIndex !== currentQuestionIndex) {
          setQuestionHistory(prev => [...prev, targetIndex]);
          
          setTimeout(() => {
            setCurrentQuestionIndex(targetIndex);
            setVisitedQuestions(prev => new Set([...prev, targetIndex]));
          }, 300);
        }
      }
    }
  };

  // 验证当前问题
  const validateCurrentQuestion = () => {
    const currentQuestion = getCurrentQuestion();
    const answer = answers[currentQuestion.id];
    
    if (currentQuestion.required) {
      if (!answer || 
          (Array.isArray(answer) && answer.length === 0) ||
          (typeof answer === 'string' && answer.trim() === '') ||
          (currentQuestion.type === 'file' && !answer)) {
        setErrors(prev => ({
          ...prev,
          [currentQuestion.id]: '此问题为必填项'
        }));
        return false;
      }
    }
    return true;
  };

  // 导航到下一题
  const handleNext = () => {
    const currentQuestion = getCurrentQuestion();
    
    if (!validateCurrentQuestion()) {
      return;
    }

    if (currentQuestion.logic) {
      const answer = answers[currentQuestion.id];
      
      if (currentQuestion.type === 'checkbox' && Array.isArray(answer) && answer.length > 0) {
        const jumpToQuestionId = currentQuestion.logic[answer[0]];
        if (jumpToQuestionId) {
          const targetIndex = surveyData.questions.findIndex(q => q.id === jumpToQuestionId);
          if (targetIndex !== -1 && targetIndex !== currentQuestionIndex) {
            setQuestionHistory(prev => [...prev, targetIndex]);
            setCurrentQuestionIndex(targetIndex);
            setVisitedQuestions(prev => new Set([...prev, targetIndex]));
            return;
          }
        }
      }
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < surveyData.questions.length) {
      setQuestionHistory(prev => [...prev, nextIndex]);
      setCurrentQuestionIndex(nextIndex);
      setVisitedQuestions(prev => new Set([...prev, nextIndex]));
    } else {
      handleSubmit();
    }
  };

  // 导航到上一题
  const handlePrev = () => {
    if (questionHistory.length > 1) {
      const newHistory = [...questionHistory];
      newHistory.pop();
      const prevIndex = newHistory[newHistory.length - 1];
      
      setQuestionHistory(newHistory);
      setCurrentQuestionIndex(prevIndex);
    }
  };

  // 直接跳转到指定问题
  const jumpToQuestion = (index) => {
    if (visitedQuestions.has(index)) {
      setQuestionHistory(prev => [...prev, index]);
      setCurrentQuestionIndex(index);
    }
  };

  // 提交问卷
  const handleSubmit = () => {
    // 验证完整性
    const completenessCheck = validateResponseCompleteness(surveyData, answers);
    
    if (!completenessCheck.isValid) {
      setErrors(completenessCheck.errors.reduce((acc, error, index) => {
        const match = error.match(/第 (\d+) 题/);
        if (match) {
          const questionIndex = parseInt(match[1]) - 1;
          const question = surveyData.questions[questionIndex];
          if (question) {
            acc[question.id] = '此问题为必填项';
          }
        }
        return acc;
      }, {}));
      
      // 跳转到第一个有错误的问题
      const firstErrorIndex = surveyData.questions.findIndex(q => completenessCheck.errors.some(
        error => error.includes(`第 ${surveyData.questions.indexOf(q) + 1} 题`)
      ));
      if (firstErrorIndex !== -1) {
        setCurrentQuestionIndex(firstErrorIndex);
        setVisitedQuestions(prev => new Set([...prev, firstErrorIndex]));
      }
      return;
    }

    // 检测回答质量
    const completionTime = (Date.now() - startTime) / 1000; // 转换为秒
    const answersWithTime = {
      ...answers,
      _completionTime: completionTime
    };
    
    const qualityCheck = validateResponseQuality(surveyData, answersWithTime);
    
    if (qualityCheck.anomalies.length > 0 || qualityCheck.warnings.length > 0) {
      setQualityAlert({
        show: true,
        warnings: qualityCheck.warnings,
        anomalies: qualityCheck.anomalies
      });
      return;
    }
    
    submitResponse();
  };

  const submitResponse = () => {
    const completionTime = (Date.now() - startTime) / 1000;
    
    const response = {
      id: Date.now().toString(),
      surveyId: surveyData.id || 'default',
      answers,
      timestamp: new Date().toISOString(),
      completionTime: completionTime,
      qualityCheck: validateResponseQuality(surveyData, answers)
    };
    
    console.log('提交的响应数据:', response);
    onSubmit(response);
    setSubmitted(true);
    
    localStorage.removeItem('currentSurveyAnswers');
    localStorage.removeItem('currentQuestionIndex');
    localStorage.removeItem('visitedQuestions');
  };

  const handleForceSubmit = () => {
    submitResponse();
    closeQualityAlert();
  };

  const closeQualityAlert = () => {
    setQualityAlert({
      show: false,
      warnings: [],
      anomalies: []
    });
  };

  // 重置问卷
  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setCurrentQuestionIndex(0);
    setVisitedQuestions(new Set([0]));
    setQuestionHistory([0]);
    setUploadingFiles({});
    
    localStorage.removeItem('currentSurveyAnswers');
    localStorage.removeItem('currentQuestionIndex');
    localStorage.removeItem('visitedQuestions');
  };

  const currentQuestion = getCurrentQuestion();
  const isLastQuestion = currentQuestionIndex === surveyData.questions.length - 1;
  const progressPercentage = ((currentQuestionIndex + 1) / surveyData.questions.length) * 100;

  if (submitted) {
    return (
      <div className="thank-you-page">
        <h2>感谢参与！</h2>
        <p>您的问卷已成功提交。</p>
        <div className="thank-you-actions">
          <button onClick={onBack}>返回编辑</button>
          <button onClick={handleReset} className="reset-btn">填写新问卷</button>
        </div>
      </div>
    );
  }

  if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
    return (
      <div className="no-survey">
        <h2>暂无问卷</h2>
        <p>请先创建问卷内容</p>
        <button onClick={onBack}>返回创建问卷</button>
      </div>
    );
  }

  return (
    <div className="survey-taker">
      <div className="survey-header">
        <h2>{surveyData.title}</h2>
        {surveyData.description && (
          <p>{surveyData.description}</p>
        )}
      </div>

      {/* 进度指示器 */}
      <div className="progress-indicator">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="progress-text">
          已完成 {Math.round(progressPercentage)}% ({currentQuestionIndex + 1}/{surveyData.questions.length})
        </div>
      </div>

      {/* 问题导航 */}
      <div className="question-navigation">
        <div className="nav-title">问题导航:</div>
        <div className="nav-buttons">
          {surveyData.questions.map((question, index) => (
            <button
              key={question.id}
              className={`nav-button ${
                index === currentQuestionIndex ? 'active' : ''
              } ${
                visitedQuestions.has(index) ? 'visited' : ''
              } ${
                errors[question.id] ? 'has-error' : ''
              }`}
              onClick={() => jumpToQuestion(index)}
              disabled={!visitedQuestions.has(index)}
              title={question.title}
            >
              {index + 1}
              {errors[question.id] && <span className="error-dot">!</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 当前问题 */}
      <div className="questions-container">
        <QuestionRenderer
          key={currentQuestion.id}
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          onFileUpload={(file) => handleFileUpload(currentQuestion.id, file)}
          error={errors[currentQuestion.id]}
          number={currentQuestionIndex + 1}
          isUploading={uploadingFiles[currentQuestion.id] || false}
        />
      </div>

      {/* 导航按钮 */}
      <div className="navigation-buttons horizontal-layout">
        <div className="nav-group">
          <button 
            onClick={handlePrev}
            disabled={questionHistory.length <= 1}
            className="prev-btn"
          >
            ← 上一题
          </button>
          
          <div className="nav-info">
            <span className="page-indicator">
              第 {currentQuestionIndex + 1} 题，共 {surveyData.questions.length} 题
            </span>
            <button 
              onClick={handleReset}
              className="reset-btn-small"
              title="重置所有答案"
            >
              重置问卷
            </button>
          </div>
          
          {!isLastQuestion ? (
            <button onClick={handleNext} className="next-btn">
              下一题 →
            </button>
          ) : (
            <button onClick={handleSubmit} className="submit-btn">
              提交问卷
            </button>
          )}
        </div>
      </div>

      {/* 逻辑跳转提示 */}
      {currentQuestion.logic && Object.keys(currentQuestion.logic).length > 0 && (
        <div className="logic-hint">
          <small>💡 注意：选择某些选项可能会跳转到其他问题</small>
        </div>
      )}

      {/* 回答质量提示弹窗 */}
      {qualityAlert.show && (
        <>
          <div className="alert-overlay" onClick={closeQualityAlert}></div>
          <QualityAlert
            warnings={qualityAlert.warnings}
            anomalies={qualityAlert.anomalies}
            onClose={closeQualityAlert}
            onForceSubmit={handleForceSubmit}
          />
        </>
      )}
    </div>
  );
};

export default SurveyTaker;