// components/ValidationAlert.js
import React from 'react';
import './ValidationAlert.css';

const ValidationAlert = ({ errors, onClose, onShowProblem }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="validation-alert">
      <div className="alert-header">
        <h3>问卷存在问题</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="alert-content">
        <p>发现以下问题需要修复：</p>
        <ul className="error-list">
          {errors.map((error, index) => (
            <li key={index} className="error-item">
              {error}
              {onShowProblem && (
                <button 
                  className="locate-btn"
                  onClick={() => onShowProblem(index)}
                >
                  定位问题
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="alert-footer">
        <button className="confirm-btn" onClick={onClose}>
          我知道了
        </button>
      </div>
    </div>
  );
};

export default ValidationAlert;