// components/QuestionRenderer.js - 修复版本
import React from 'react';
import FileUploader from './FileUploader';
import './QuestionRenderer.css';

const QuestionRenderer = ({ 
  question, 
  answer, 
  onChange, 
  onFileUpload, 
  error, 
  number, 
  isUploading 
}) => {
  const renderQuestion = () => {
    switch (question.type) {
      case 'radio':
        return (
          <div className="options-container">
            {question.options.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  onChange={() => onChange(option)}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="options-container">
            {question.options.map((option, index) => {
              const isChecked = Array.isArray(answer) && answer.includes(option);
              return (
                <label key={index} className="option-label">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...(answer || []), option]
                        : (answer || []).filter(item => item !== option);
                      onChange(newValue);
                    }}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        );
      
      case 'text':
        return (
          <textarea
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="请输入您的回答"
            rows={3}
          />
        );
      
      case 'file':
        return (
          <FileUploader
            question={question}
            value={answer}
            onChange={onChange}  // 这里使用 onChange 而不是 onFileUpload
            disabled={isUploading}
          />
        );
      
      default:
        return <div>不支持的问题类型</div>;
    }
  };

  return (
    <div className={`question-container ${error ? 'has-error' : ''}`}>
      <div className="question-header">
        <span className="question-number">{number}.</span>
        <h3 className="question-title">
          {question.title}
          {question.required && <span className="required-mark">*</span>}
        </h3>
      </div>
      
      {renderQuestion()}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default QuestionRenderer;