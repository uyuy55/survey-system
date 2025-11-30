// components/AISuggestionPanel.js
import React, { useState } from 'react';
import AISuggestionService from '../services/AISuggestionService';
import './AISuggestionPanel.css';

const AISuggestionPanel = ({ questionType, onSuggestionSelect, onClose }) => {
  const [keywords, setKeywords] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [error, setError] = useState('');

  // 生成建议
  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('请输入关键词');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const newSuggestions = await AISuggestionService.generateQuestionSuggestions(
        keywords, 
        questionType, 
        3
      );
      
      if (newSuggestions && newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
      } else {
        setError('未能生成建议，请尝试其他关键词');
      }
    } catch (error) {
      console.error('生成建议失败:', error);
      setError('生成失败，请检查网络连接或API配置');
    } finally {
      setLoading(false);
    }
  };

  // 选择建议
  const handleSelectSuggestion = (suggestion) => {
    onSuggestionSelect(suggestion);
    onClose();
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <div className="ai-suggestion-panel">
      <div className="suggestion-header">
        <h3>🤖 AI 题目建议</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="suggestion-tabs">
        <button 
          className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          生成新题目
        </button>
        <button 
          className={`tab-btn ${activeTab === 'improve' ? 'active' : ''}`}
          onClick={() => setActiveTab('improve')}
        >
          优化现有题目
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="generate-tab">
          <div className="input-group">
            <label>主题关键词：</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="例如：用户体验、产品功能、客户服务..."
              className="keyword-input"
            />
            <div className="input-hint">输入问卷主题，AI 将生成相关题目</div>
          </div>
          
          <button 
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !keywords.trim()}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                生成中...
              </>
            ) : (
              '✨ 生成建议'
            )}
          </button>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="suggestions-list">
              <h4>📋 建议题目：</h4>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <div className="suggestion-title">{suggestion.title}</div>
                  {suggestion.options && suggestion.options.length > 0 && (
                    <div className="suggestion-options">
                      <span className="options-label">选项：</span>
                      {suggestion.options.map((option, optIndex) => (
                        <span key={optIndex} className="option-tag">{option}</span>
                      ))}
                    </div>
                  )}
                  <button 
                    className="use-suggestion-btn"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    ✅ 使用此建议
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="ai-tips">
            <h5>💡 使用技巧：</h5>
            <ul>
              <li>使用具体的关键词获得更精准的建议</li>
              <li>可以尝试不同的关键词组合</li>
              <li>生成的题目可以进一步自定义修改</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'improve' && (
        <div className="improve-tab">
          <div className="improve-info">
            <p>输入现有题目，AI 将帮助优化表达和选项设置</p>
          </div>
          <div className="input-group">
            <label>现有题目：</label>
            <textarea
              placeholder="请输入需要优化的题目内容..."
              className="improve-textarea"
            />
          </div>
          <div className="input-group">
            <label>当前选项（可选）：</label>
            <input
              type="text"
              placeholder="选项1, 选项2, 选项3..."
              className="keyword-input"
            />
          </div>
          <button className="improve-btn" disabled>
            🛠️ 优化题目（开发中）
          </button>
          <div className="coming-soon">
            优化功能即将上线，敬请期待！
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestionPanel;