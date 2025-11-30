// components/Navigation.js
import React from 'react';
import './Navigation.css';

const Navigation = ({ currentView, onViewChange, hasSurvey, hasResponses }) => {
  return (
    <nav className="navigation">
      <button 
        onClick={() => onViewChange('creator')}
        className={currentView === 'creator' ? 'active' : ''}
      >
        📝 创建问卷
      </button>
      
      {hasSurvey && (
        <button 
          onClick={() => onViewChange('taker')}
          className={currentView === 'taker' ? 'active' : ''}
        >
          ✏️ 填写问卷
        </button>
      )}
      
      {hasResponses && (
        <button 
          onClick={() => onViewChange('results')}
          className={currentView === 'results' ? 'active' : ''}
        >
          📊 查看结果
        </button>
      )}
    </nav>
  );
};

export default Navigation;