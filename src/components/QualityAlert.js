// components/QualityAlert.js
import React from 'react';
import './ValidationAlert.css'; // 复用样式

const QualityAlert = ({ warnings, anomalies, onClose, onForceSubmit }) => {
  const hasWarnings = warnings.length > 0;
  const hasAnomalies = anomalies.length > 0;

  return (
    <div className="validation-alert">
      <div className="alert-header">
        <h3>回答质量提示</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="alert-content">
        {hasAnomalies && (
          <>
            <p style={{ color: '#c53030' }}>检测到异常回答模式：</p>
            <ul className="error-list">
              {anomalies.map((anomaly, index) => (
                <li key={index} className="error-item">
                  {anomaly}
                </li>
              ))}
            </ul>
          </>
        )}
        
        {hasWarnings && (
          <>
            <p style={{ color: '#d69e2e' }}>温馨提示：</p>
            <ul className="error-list">
              {warnings.map((warning, index) => (
                <li key={index} className="error-item" style={{ borderColor: '#faf089', background: '#fffaf0' }}>
                  {warning}
                </li>
              ))}
            </ul>
          </>
        )}
        
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          {hasAnomalies 
            ? '请检查您的回答，确保认真填写问卷'
            : '建议您检查回答内容，确保信息准确'
          }
        </p>
      </div>
      
      <div className="alert-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button 
          className="confirm-btn" 
          onClick={onClose}
          style={{ background: '#6c757d' }}
        >
          返回修改
        </button>
        <button 
          className="confirm-btn" 
          onClick={onForceSubmit}
          style={{ background: hasAnomalies ? '#e53e3e' : '#d69e2e' }}
        >
          {hasAnomalies ? '强制提交' : '确认提交'}
        </button>
      </div>
    </div>
  );
};

export default QualityAlert;