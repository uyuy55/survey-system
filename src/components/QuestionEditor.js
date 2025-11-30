// components/QuestionEditor.js - 更新部分
import React from 'react';

// LogicEditor 组件定义
const LogicEditor = ({ question, onUpdate, survey, isLocked, onEditStart, onEditEnd }) => {
  const updateLogic = (option, targetQuestionId) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    
    const newLogic = { ...question.logic };
    if (targetQuestionId) {
      newLogic[option] = targetQuestionId;
    } else {
      delete newLogic[option];
    }
    onUpdate({ logic: newLogic });
    
    if (onEditEnd) onEditEnd();
  };

  return (
    <div className="logic-editor">
      <h4>逻辑跳转设置</h4>
      {question.options.map((option, index) => (
        <div key={index} className="logic-rule">
          <span>选择 "{option}" 时跳转到: </span>
          <select
            value={question.logic?.[option] || ''}
            onChange={(e) => updateLogic(option, e.target.value)}
            disabled={isLocked}
          >
            <option value="">不跳转（继续下一题）</option>
            {survey.questions
              .filter(q => q.id !== question.id)
              .map(q => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
          </select>
        </div>
      ))}
    </div>
  );
};

// 主 QuestionEditor 组件
const QuestionEditor = ({ 
  question, 
  index, 
  onUpdate, 
  onDelete, 
  onMove, 
  onEditStart,
  onEditEnd,
  survey, 
  isLocked,
  lockInfo 
}) => {
  const handleTitleChange = (e) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    onUpdate({ title: e.target.value });
  };

  const handleRequiredChange = (e) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    onUpdate({ required: e.target.checked });
  };

  const handleOptionChange = (optionIndex, value) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    const newOptions = [...question.options, `选项${question.options.length + 1}`];
    onUpdate({ options: newOptions });
  };

  const removeOption = (optionIndex) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    const newOptions = question.options.filter((_, index) => index !== optionIndex);
    onUpdate({ options: newOptions });
  };

  // 处理文件类型设置
  const handleFileTypeChange = (e) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    onUpdate({ fileType: e.target.value });
  };

  // 处理文件大小限制
  const handleMaxSizeChange = (e) => {
    if (isLocked) return;
    
    if (onEditStart) onEditStart();
    onUpdate({ maxSize: parseInt(e.target.value) || 5 });
  };

  const getQuestionTypeName = (type) => {
    const types = {
      radio: '单选题',
      checkbox: '多选题',
      text: '填空题',
      file: '文件上传题'
    };
    return types[type] || type;
  };

  // 渲染锁定状态
  const renderLockStatus = () => {
    if (isLocked && lockInfo) {
      return (
        <div className="lock-overlay">
          <div className="lock-message">
            🔒 正在被 {lockInfo.userName} 编辑
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`question-editor ${isLocked ? 'locked' : ''}`}>
      {renderLockStatus()}
      
      <div className="question-header">
        <span className="question-type-badge">
          {getQuestionTypeName(question.type)}
        </span>
        <input
          type="text"
          value={question.title}
          onChange={handleTitleChange}
          onBlur={onEditEnd}
          className="question-title-input"
          placeholder="输入问题标题"
          disabled={isLocked}
        />
        <div className="question-actions">
          <button 
            onClick={() => onMove('up')} 
            disabled={index === 0 || isLocked}
          >
            上移
          </button>
          <button 
            onClick={() => onMove('down')} 
            disabled={index === survey.questions.length - 1 || isLocked}
          >
            下移
          </button>
          <button 
            className="delete" 
            onClick={onDelete}
            disabled={isLocked}
          >
            删除
          </button>
        </div>
      </div>

      <div className="required-toggle">
        <input
          type="checkbox"
          id={`required-${question.id}`}
          checked={question.required}
          onChange={handleRequiredChange}
          onBlur={onEditEnd}
          disabled={isLocked}
        />
        <label htmlFor={`required-${question.id}`}>必填问题</label>
      </div>

      {(question.type === 'radio' || question.type === 'checkbox') && (
        <>
          <div className="options-list">
            <label>选项：</label>
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="option-item">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                  onBlur={onEditEnd}
                  className="option-input"
                  placeholder={`选项 ${optionIndex + 1}`}
                  disabled={isLocked}
                />
                {question.options.length > 2 && (
                  <button
                    type="button"
                    className="remove-option-btn"
                    onClick={() => removeOption(optionIndex)}
                    onBlur={onEditEnd}
                    disabled={isLocked}
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="add-option-btn" 
              onClick={addOption}
              onBlur={onEditEnd}
              disabled={isLocked}
            >
              添加选项
            </button>
          </div>

          {/* 添加 LogicEditor 组件 */}
          <LogicEditor 
            question={question}
            onUpdate={onUpdate}
            survey={survey}
            isLocked={isLocked}
            onEditStart={onEditStart}
            onEditEnd={onEditEnd}
          />
        </>
      )}

      {question.type === 'file' && (
        <div className="file-settings">
          <div className="setting-group">
            <label>文件类型：</label>
            <select 
              value={question.fileType || 'all'} 
              onChange={handleFileTypeChange}
              onBlur={onEditEnd}
              disabled={isLocked}
            >
              <option value="all">所有文件</option>
              <option value="image">仅图片</option>
              <option value="document">仅文档</option>
            </select>
          </div>
          <div className="setting-group">
            <label>最大文件大小 (MB)：</label>
            <input
              type="number"
              value={question.maxSize || 5}
              onChange={handleMaxSizeChange}
              onBlur={onEditEnd}
              min="1"
              max="50"
              disabled={isLocked}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;