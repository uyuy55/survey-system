// App.js - 主应用组件（带 AI 功能状态显示）
import React, { useState, useEffect } from 'react';
import SurveyCreator from './components/SurveyCreator';
import LazyLoader from './components/LazyLoader';
import { checkAIConfig } from './utils/aiConfigChecker';
import './App.css';

// 懒加载并使用统一的 LazyLoader（可定制 fallback）
const SurveyTaker = LazyLoader(() => import('./components/SurveyTaker'), <div>问卷加载中…</div>);
const SurveyResults = LazyLoader(() => import('./components/SurveyResults'), <div>结果加载中…</div>);

function App() {
  const [currentView, setCurrentView] = useState('creator'); // creator, taker, results
  const [surveyData, setSurveyData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [aiStatus, setAiStatus] = useState('checking');

  // 从localStorage加载数据
  useEffect(() => {
    const savedSurvey = localStorage.getItem('surveyData');
    const savedResponses = localStorage.getItem('surveyResponses');
    
    if (savedSurvey) setSurveyData(JSON.parse(savedSurvey));
    if (savedResponses) setResponses(JSON.parse(savedResponses));

    // 检查 AI 配置
    const config = checkAIConfig();
    setAiStatus(config.hasApiKey ? 'enabled' : 'disabled');
  }, []);

  // 保存问卷到localStorage
  const saveSurvey = (data) => {
    setSurveyData(data);
    localStorage.setItem('surveyData', JSON.stringify(data));
  };

  // 保存回答到localStorage
  const saveResponse = (response) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);
    localStorage.setItem('surveyResponses', JSON.stringify(newResponses));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📝 在线问卷调查系统</h1>
          <div className="header-features">
            <span className={`ai-status ${aiStatus}`}>
              {aiStatus === 'enabled' ? '🤖 AI 已启用' : '⚡ 基础模式'}
            </span>
            <span className="collaboration-badge">👥 实时协作</span>
          </div>
        </div>
        <nav>
          <button 
            className={currentView === 'creator' ? 'active' : ''}
            onClick={() => setCurrentView('creator')}
          >
            🛠️ 创建问卷
          </button>
          <button 
            className={currentView === 'taker' ? 'active' : ''}
            onClick={() => setCurrentView('taker')}
            disabled={!surveyData}
          >
            📊 填写问卷
          </button>
          <button 
            className={currentView === 'results' ? 'active' : ''}
            onClick={() => setCurrentView('results')}
            disabled={!surveyData}
          >
            📈 查看结果
          </button>
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'creator' && (
            <SurveyCreator 
              surveyData={surveyData} 
              onSave={saveSurvey} 
            />
        )}
        {currentView === 'taker' && (
            <SurveyTaker 
              surveyData={surveyData} 
              onSubmit={saveResponse}
              onBack={() => setCurrentView('creator')}
            />
        )}
        {currentView === 'results' && (
            <SurveyResults 
              surveyData={surveyData} 
              responses={responses} 
            />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>💡 提示：{aiStatus === 'enabled' 
            ? 'AI 建议功能已启用，可智能生成题目' 
            : '配置 API 密钥可启用 AI 智能建议功能'
          }</p>
        </div>
      </footer>
    </div>
  );
}

export default App;