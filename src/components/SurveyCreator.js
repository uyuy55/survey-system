// components/SurveyCreator.js - 问卷设计器（带协作和AI功能）
import React, { useState, lazy, useEffect } from 'react';
import { validateSurvey } from '../utils/validation';
import ValidationAlert from './ValidationAlert';
import collaborationService from '../services/PeerCollaboration';
import AISuggestionPanel from './AISuggestionPanel';
import './SurveyCreator.css';

// 懒加载 QuestionEditor 组件
const LazyQuestionEditor = lazy(() => import('./QuestionEditor'));

const SurveyCreator = ({ surveyData, onSave }) => {
  const [survey, setSurvey] = useState(surveyData || {
    id: 'survey_1',
    title: '未命名问卷',
    description: '',
    questions: []
  });

  const [validationAlert, setValidationAlert] = useState({
    show: false,
    errors: []
  });

  const [collaborationState, setCollaborationState] = useState({
    isConnected: false,
    userCount: 0,
    lockedQuestions: new Map()
  });

  // AI 建议面板状态
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiQuestionType, setAIQuestionType] = useState('radio');

  // 初始化协作
  useEffect(() => {
    collaborationService.setCallbacks({
      onSurveyUpdate: (surveyData, userId) => {
        console.log('收到协作更新:', userId);
        if (userId !== collaborationService.userId) {
          setSurvey(surveyData);
        }
      },
      
      onUsersUpdate: (users) => {
        setCollaborationState(prev => ({
          ...prev,
          userCount: users.length
        }));
      },
      
      onQuestionLock: (questionId, userId, userName, isLocked) => {
        setCollaborationState(prev => {
          const newLocks = new Map(prev.lockedQuestions);
          if (isLocked) {
            newLocks.set(questionId, { userId, userName });
          } else {
            newLocks.delete(questionId);
          }
          return { ...prev, lockedQuestions: newLocks };
        });
      },
      
      onConnectionStatus: (connected, count) => {
        setCollaborationState(prev => ({
          ...prev,
          isConnected: connected,
          userCount: count
        }));
      }
    });

    // 加入协作房间
    collaborationService.joinRoom(survey.id);

    return () => {
      collaborationService.leaveRoom();
    };
  }, [survey.id]);

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now().toString(),
      type,
      title: '新问题',
      required: false,
      options: type === 'text' ? [] : ['选项1', '选项2'],
      logic: {}
    };

    const newSurvey = {
      ...survey,
      questions: [...survey.questions, newQuestion]
    };

    setSurvey(newSurvey);
    collaborationService.updateSurvey(newSurvey);
  };

  // 添加来自 AI 建议的问题
  const addQuestionFromAI = (suggestion) => {
    const newQuestion = {
      id: Date.now().toString(),
      type: aiQuestionType,
      title: suggestion.title,
      required: false,
      options: suggestion.options || [],
      logic: {}
    };

    const newSurvey = {
      ...survey,
      questions: [...survey.questions, newQuestion]
    };

    setSurvey(newSurvey);
    collaborationService.updateSurvey(newSurvey);
    setShowAIPanel(false);
  };

  // 打开 AI 建议面板
  const openAIPanel = (type) => {
    setAIQuestionType(type);
    setShowAIPanel(true);
  };

  const updateQuestion = (id, updates) => {
    const updatedQuestions = survey.questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    );
    
    const newSurvey = {
      ...survey,
      questions: updatedQuestions
    };
    
    setSurvey(newSurvey);
    collaborationService.updateSurvey(newSurvey);
  };

  const deleteQuestion = (id) => {
    // 解锁问题
    collaborationService.unlockQuestion(id);
    
    const filteredQuestions = survey.questions.filter(q => q.id !== id);
    const newSurvey = {
      ...survey,
      questions: filteredQuestions
    };
    
    setSurvey(newSurvey);
    collaborationService.updateSurvey(newSurvey);
  };

  const moveQuestion = (id, direction) => {
    const index = survey.questions.findIndex(q => q.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === survey.questions.length - 1)
    ) return;

    const newQuestions = [...survey.questions];
    const swapIndex = direction === 'up' ? index - 1 : direction === 'down' ? index + 1 : index;
    [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
    
    const newSurvey = {
      ...survey,
      questions: newQuestions
    };
    
    setSurvey(newSurvey);
    collaborationService.updateSurvey(newSurvey);
  };

  // 问题编辑开始（锁定问题）
  const handleQuestionEditStart = (questionId) => {
    collaborationService.lockQuestion(questionId);
  };

  // 问题编辑结束（解锁问题）
  const handleQuestionEditEnd = (questionId) => {
    collaborationService.unlockQuestion(questionId);
  };

  const handleSave = () => {
    const validation = validateSurvey(survey);

    if (!validation.isValid) {
      setValidationAlert({
        show: true,
        errors: validation.errors
      });
      return;
    }

    onSave(survey);
    alert('问卷保存成功！');
  };

  const closeValidationAlert = () => {
    setValidationAlert({
      show: false,
      errors: []
    });
  };

  const locateProblem = (errorIndex) => {
    const error = validationAlert.errors[errorIndex];
    if (error && error.includes('第')) {
      const match = error.match(/第 (\d+) 个问题/);
      if (match) {
        const questionIndex = parseInt(match[1]) - 1;
        
        closeValidationAlert();
        
        setTimeout(() => {
          const questionElements = document.querySelectorAll('.question-editor');
          if (questionElements.length > questionIndex) {
            const targetElement = questionElements[questionIndex];
            
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            targetElement.style.transition = 'all 0.3s ease';
            targetElement.style.boxShadow = '0 0 0 3px #ff6b6b';
            targetElement.style.border = '2px solid #ff6b6b';
            
            setTimeout(() => {
              targetElement.style.boxShadow = '';
              targetElement.style.border = '';
            }, 3000);
          }
        }, 100);
      }
    } else {
      closeValidationAlert();
    }
  };

  // 简单的加载回退组件
  const QuestionEditorFallback = ({ question, index, onUpdate, onDelete, onMove, survey }) => (
    <div className="question-editor loading">
      <div className="question-header">
        <div className="question-type-badge">{question.type === 'radio' ? '单选' : question.type === 'checkbox' ? '多选' : question.type === 'text' ? '填空' : '文件'}</div>
        <input
          type="text"
          value={question.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="question-title-input"
          placeholder="问题标题"
        />
        <div className="question-actions">
          <button onClick={() => onMove('up')}>↑</button>
          <button onClick={() => onMove('down')}>↓</button>
          <button className="delete" onClick={onDelete}>删除</button>
        </div>
      </div>
      <div className="loading-text">加载完整编辑器...</div>
    </div>
  );

  return (
    <div className="survey-creator">
      {/* 协作状态栏 */}
      <div className="collaboration-status-bar">
        <div className="connection-status">
          <span className={`status-indicator ${collaborationState.isConnected ? 'connected' : 'disconnected'}`}>
            {collaborationState.isConnected ? '●' : '○'}
          </span>
          {collaborationState.isConnected ? '已连接' : '未连接'}
        </div>
        <div className="user-count">
          在线用户：{collaborationState.userCount} 人在线
        </div>
        <div className="collaboration-notice">
          实时协作编辑已启用，多人可同时编辑问卷
        </div>
      </div>

      <div className="creator-header">
        <input
          type="text"
          value={survey.title}
          onChange={(e) => {
            const newSurvey = { ...survey, title: e.target.value };
            setSurvey(newSurvey);
            collaborationService.updateSurvey(newSurvey);
          }}
          className="survey-title"
          placeholder="问卷标题"
        />
        <textarea
          value={survey.description}
          onChange={(e) => {
            const newSurvey = { ...survey, description: e.target.value };
            setSurvey(newSurvey);
            collaborationService.updateSurvey(newSurvey);
          }}
          className="survey-description"
          placeholder="问卷描述"
        />
      </div>

      {/* AI 建议面板 */}
      {showAIPanel && (
        <AISuggestionPanel
          questionType={aiQuestionType}
          onSuggestionSelect={addQuestionFromAI}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      <div className="questions-list">
        {survey.questions.map((question, index) => (
          <React.Suspense 
            key={question.id} 
            fallback={
              <QuestionEditorFallback
                question={question}
                index={index}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
                onMove={(direction) => moveQuestion(question.id, direction)}
                survey={survey}
              />
            }
          >
            <LazyQuestionEditor
              question={question}
              index={index}
              onUpdate={(updates) => updateQuestion(question.id, updates)}
              onDelete={() => deleteQuestion(question.id)}
              onMove={(direction) => moveQuestion(question.id, direction)}
              onEditStart={() => handleQuestionEditStart(question.id)}
              onEditEnd={() => handleQuestionEditEnd(question.id)}
              survey={survey}
              isLocked={collaborationState.lockedQuestions.has(question.id)}
              lockInfo={collaborationState.lockedQuestions.get(question.id)}
            />
          </React.Suspense>
        ))}
      </div>

      <div className="creator-actions">
        <div className="action-section">
          <div className="section-title">添加题目：</div>
          <div className="add-question-buttons">
            <button onClick={() => addQuestion('radio')}>单选题</button>
            <button onClick={() => addQuestion('checkbox')}>多选题</button>
            <button onClick={() => addQuestion('text')}>填空题</button>
            <button onClick={() => addQuestion('file')}>文件上传题</button>
          </div>
        </div>
        
        <div className="action-section">
          <div className="section-title">AI 智能建议：</div>
          <div className="ai-suggestion-buttons">
            <button 
              className="ai-suggestion-btn"
              onClick={() => openAIPanel('radio')}
              title="AI 生成单选题建议"
            >
              🤖 单选题建议
            </button>
            <button 
              className="ai-suggestion-btn"
              onClick={() => openAIPanel('checkbox')}
              title="AI 生成多选题建议"
            >
              🤖 多选题建议
            </button>
            <button 
              className="ai-suggestion-btn"
              onClick={() => openAIPanel('text')}
              title="AI 生成填空题建议"
            >
              🤖 填空题建议
            </button>
          </div>
        </div>

        <button 
          className="save-survey-btn"
          onClick={handleSave}
        >
          保存问卷
        </button>
      </div>

      {/* 异常提示弹窗 */}
      {validationAlert.show && (
        <>
          <div className="alert-overlay" onClick={closeValidationAlert}></div>
          <ValidationAlert
            errors={validationAlert.errors}
            onClose={closeValidationAlert}
            onShowProblem={locateProblem}
          />
        </>
      )}
    </div>
  );
};

export default SurveyCreator;