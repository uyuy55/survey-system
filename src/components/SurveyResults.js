// components/SurveyResults.js - 结果统计组件（带实时预览）
import React, { useState, useEffect, useCallback } from 'react';
import ResultsChart from './ResultsChart';
import './SurveyResults.css';

const SurveyResults = ({ surveyData, responses: initialResponses }) => {
  const [chartTypes, setChartTypes] = useState({});
  const [responses, setResponses] = useState(initialResponses || []);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRealTime, setIsRealTime] = useState(false);
  const [newSubmissions, setNewSubmissions] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 实时数据获取
  useEffect(() => {
    if (!isRealTime) return;

    const fetchLatestResponses = async () => {
      try {
        // 从 localStorage 获取最新回答
        const savedResponses = localStorage.getItem('surveyResponses');
        if (savedResponses) {
          const latestResponses = JSON.parse(savedResponses);
          
          // 检测新提交
          if (latestResponses.length > responses.length) {
            const newCount = latestResponses.length - responses.length;
            setNewSubmissions(newCount);
            setResponses(latestResponses);
            setLastUpdate(new Date());
            
            // 显示新提交通知
            if (newCount > 0) {
              showNewSubmissionAlert(newCount);
            }
          }
        }
      } catch (error) {
        console.error('获取实时数据失败:', error);
      }
    };

    // 每5秒检查一次新提交
    const interval = setInterval(fetchLatestResponses, 5000);
    
    return () => clearInterval(interval);
  }, [isRealTime, responses.length]);

  // 新提交通知
  const showNewSubmissionAlert = (count) => {
    // 移除已存在的通知
    const existingNotification = document.querySelector('.real-time-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'real-time-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">📊</span>
        <span>收到 ${count} 个新提交</span>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);

    // 添加关闭事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
    
    // 3秒后自动消失
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  };

  // 手动刷新数据
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const savedResponses = localStorage.getItem('surveyResponses');
      if (savedResponses) {
        const latestResponses = JSON.parse(savedResponses);
        const newCount = latestResponses.length - responses.length;
        
        setResponses(latestResponses);
        setLastUpdate(new Date());
        setNewSubmissions(newCount);
        
        if (newCount > 0) {
          showNewSubmissionAlert(newCount);
        }
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [responses.length]);

  // 切换实时模式
  const toggleRealTime = () => {
    const newRealTimeState = !isRealTime;
    setIsRealTime(newRealTimeState);
    if (newRealTimeState) {
      refreshData();
    }
  };

  // 添加安全访问函数
  const getSurveyQuestions = () => {
    return surveyData?.questions || [];
  };

  const getSurveyTitle = () => {
    return surveyData?.title || '未命名问卷';
  };

  const getCurrentResponses = () => {
    return responses || [];
  };

  // 文件大小格式化函数
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 实时统计信息
  const getRealTimeStats = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentSubmissions = responses.filter(response => {
      const submitTime = new Date(response.timestamp || response.completionTime);
      return submitTime > oneHourAgo;
    });
    
    const dailySubmissions = responses.filter(response => {
      const submitTime = new Date(response.timestamp || response.completionTime);
      return submitTime > oneDayAgo;
    });
    
    return {
      total: responses.length,
      recentHour: recentSubmissions.length,
      today: dailySubmissions.length,
      newSubmissions
    };
  };

  const calculateStats = () => {
    const questions = getSurveyQuestions();
    const responseList = getCurrentResponses();
    
    if (!questions.length || !responseList.length) return {};

    const stats = {};
    
    questions.forEach(question => {
      if (!question || !question.id) return;
      
      if (question.type === 'radio' || question.type === 'checkbox') {
        stats[question.id] = {
          type: question.type,
          title: question.title || '未命名问题',
          options: (question.options || []).reduce((acc, option) => {
            acc[option] = 0;
            return acc;
          }, {})
        };
        
        responseList.forEach(response => {
          if (!response || !response.answers) return;
          
          const answer = response.answers[question.id];
          if (answer) {
            if (Array.isArray(answer)) {
              answer.forEach(opt => {
                if (stats[question.id].options[opt] !== undefined) {
                  stats[question.id].options[opt]++;
                }
              });
            } else {
              if (stats[question.id].options[answer] !== undefined) {
                stats[question.id].options[answer]++;
              }
            }
          }
        });
      } else if (question.type === 'text') {
        stats[question.id] = {
          type: 'text',
          title: question.title || '未命名问题',
          responses: responseList
            .map(r => r?.answers?.[question.id])
            .filter(Boolean)
        };
      } else if (question.type === 'file') {
        stats[question.id] = {
          type: 'file',
          title: question.title || '未命名问题',
          files: responseList
            .map(response => {
              const fileInfo = response?.answers?.[question.id];
              return fileInfo ? {
                ...fileInfo,
                responseId: response.id
              } : null;
            })
            .filter(Boolean)
        };
      }
    });
    
    return stats;
  };

  const handleChartTypeChange = (questionId, newType) => {
    setChartTypes(prev => ({
      ...prev,
      [questionId]: newType
    }));
  };

  const stats = calculateStats();
  const questions = getSurveyQuestions();
  const responseList = getCurrentResponses();
  const realTimeStats = getRealTimeStats();

  // 导出功能
  const exportToJSON = () => {
    const data = {
      survey: surveyData || {},
      responses: responseList,
      statistics: stats,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSurveyTitle()}_results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const BOM = '\uFEFF';
    let csv = BOM + '回答ID,时间戳,完成时间';
    
    questions.forEach(question => {
      csv += `,"${question.title || '未命名问题'}"`;
    });
    csv += '\n';
    
    responseList.forEach((response) => {
      csv += `${response.id || ''},${response.timestamp || ''},${response.completionTime || response.timestamp || ''}`;
      
      questions.forEach(question => {
        const answer = response?.answers?.[question.id];
        let answerText = '';
        
        if (answer) {
          if (Array.isArray(answer)) {
            answerText = answer.join('; ');
          } else if (typeof answer === 'object') {
            // 处理文件对象
            answerText = answer.name || '已上传文件';
          } else {
            answerText = answer.toString();
          }
        }
        
        answerText = answerText.replace(/"/g, '""');
        if (answerText.includes(',') || answerText.includes('"') || answerText.includes('\n')) {
          answerText = `"${answerText}"`;
        }
        
        csv += `,${answerText}`;
      });
      csv += '\n';
    });
    
    const blob = new Blob([csv], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSurveyTitle()}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSVExcel = () => {
    const BOM = '\uFEFF';
    let csv = BOM + '回答ID\t时间戳\t完成时间';
    
    questions.forEach(question => {
      csv += `\t"${question.title || '未命名问题'}"`;
    });
    csv += '\n';
    
    responseList.forEach((response) => {
      csv += `${response.id || ''}\t${response.timestamp || ''}\t${response.completionTime || response.timestamp || ''}`;
      
      questions.forEach(question => {
        const answer = response?.answers?.[question.id];
        let answerText = '';
        
        if (answer) {
          if (Array.isArray(answer)) {
            answerText = answer.join('; ');
          } else if (typeof answer === 'object') {
            answerText = answer.name || '已上传文件';
          } else {
            answerText = answer.toString();
          }
        }
        
        answerText = answerText.replace(/"/g, '""');
        if (answerText.includes('\t') || answerText.includes('"') || answerText.includes('\n')) {
          answerText = `"${answerText}"`;
        }
        
        csv += `\t${answerText}`;
      });
      csv += '\n';
    });
    
    const blob = new Blob([csv], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSurveyTitle()}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 计算总体统计
  const totalResponses = responseList.length;
  const questionCount = questions.length;
  const completionRate = questionCount > 0 ? 
    (Object.keys(stats).length / questionCount) * 100 : 0;

  // 安全获取统计数据的键
  const statKeys = stats ? Object.keys(stats) : [];

  return (
    <div className="survey-results">
      <div className="results-header">
        <div className="header-top">
          <h2>{getSurveyTitle()} - 结果统计</h2>
          <div className="real-time-controls">
            <button 
              className={`real-time-btn ${isRealTime ? 'active' : ''}`}
              onClick={toggleRealTime}
            >
              {isRealTime ? '🔴 实时模式' : '⚪ 普通模式'}
            </button>
            <button 
              onClick={refreshData} 
              className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
              disabled={isRefreshing}
            >
              {isRefreshing ? '🔄 刷新中...' : '🔄 刷新'}
            </button>
            {isRealTime && (
              <span className="last-update">
                最后更新: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {/* 实时统计面板 */}
        {isRealTime && (
          <div className="real-time-stats">
            <div className="stat-item real-time">
              <span className="stat-value">{realTimeStats.total}</span>
              <span className="stat-label">总提交</span>
            </div>
            <div className="stat-item real-time">
              <span className="stat-value">{realTimeStats.today}</span>
              <span className="stat-label">今日提交</span>
            </div>
            <div className="stat-item real-time">
              <span className="stat-value">{realTimeStats.recentHour}</span>
              <span className="stat-label">近1小时</span>
            </div>
            {newSubmissions > 0 && (
              <div className="stat-item new-submissions">
                <span className="stat-value">+{newSubmissions}</span>
                <span className="stat-label">新提交</span>
              </div>
            )}
          </div>
        )}

        <div className="overall-stats">
          <div className="stat-item">
            <span className="stat-value">{totalResponses}</span>
            <span className="stat-label">总参与人数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Math.round(completionRate)}%</span>
            <span className="stat-label">完成率</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{questionCount}</span>
            <span className="stat-label">问题数量</span>
          </div>
        </div>
        
        {totalResponses > 0 && (
          <div className="export-buttons">
            <button onClick={exportToJSON}>导出为JSON</button>
            <button onClick={exportToCSV}>导出为CSV</button>
            <button onClick={exportToCSVExcel} className="excel-btn">导出为Excel CSV</button>
          </div>
        )}
      </div>

      {/* 最近提交时间线 */}
      {isRealTime && responses.length > 0 && (
        <div className="recent-submissions">
          <h3>📈 最近提交活动</h3>
          <div className="submissions-timeline">
            {responses
              .slice(-5)
              .reverse()
              .map((response, index) => (
                <div key={response.id} className="submission-item">
                  <span className="submission-time">
                    {new Date(response.timestamp || response.completionTime).toLocaleTimeString()}
                  </span>
                  <span className="submission-id">ID: {response.id?.slice(-6) || '未知'}</span>
                  <span className="submission-answers">
                    回答了 {Object.keys(response.answers || {}).length} 个问题
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="results-content">
        {statKeys.length > 0 ? (
          statKeys.map(questionId => {
            const questionStats = stats[questionId];
            if (!questionStats) return null;
            
            const currentChartType = chartTypes[questionId] || 'bar';
            
            return (
              <div key={questionId} className="question-results">
                <div className="question-header">
                  <h3>{questionStats.title}</h3>
                  {(questionStats.type === 'radio' || questionStats.type === 'checkbox') && (
                    <div className="chart-controls">
                      <span>图表类型: </span>
                      <select
                        value={currentChartType}
                        onChange={(e) => handleChartTypeChange(questionId, e.target.value)}
                      >
                        <option value="bar">柱状图</option>
                        <option value="pie">饼图</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {questionStats.type === 'text' ? (
                  <div className="text-responses">
                    <h4>文本回答 ({questionStats.responses?.length || 0}):</h4>
                    <div className="responses-list">
                      {(questionStats.responses || []).map((response, index) => (
                        <div key={index} className="text-response">
                          {response}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : questionStats.type === 'file' ? (
                  <div className="file-responses">
                    <h4>文件上传 ({questionStats.files?.length || 0}):</h4>
                    <div className="files-list">
                      {(questionStats.files || []).map((file, index) => (
                        <div key={index} className="file-item">
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            {file.name} ({formatFileSize(file.size)})
                          </a>
                          <span className="file-upload-time">
                            {new Date(file.uploadTime).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ResultsChart 
                    data={questionStats} 
                    chartType={currentChartType}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="no-data">
            <h3>暂无数据</h3>
            <p>还没有收到任何问卷回答，或者所有问题都是文本类型。</p>
            {isRealTime && (
              <p className="real-time-hint">💡 实时模式已开启，新提交将自动显示</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyResults;