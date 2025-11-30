// utils/responseValidation.js
/**
 * 检测回答质量异常
 * @param {Object} survey 问卷数据
 * @param {Object} answers 用户回答
 * @returns {Object} 包含 warnings 和 anomalies 的对象
 */
export const validateResponseQuality = (survey, answers) => {
  const warnings = [];
  const anomalies = [];
  
  if (!survey.questions || !answers) {
    return { warnings, anomalies };
  }

  survey.questions.forEach((question, index) => {
    const questionNumber = index + 1;
    const answer = answers[question.id];
    
    if (!answer) return;
    
    // 检测文本题回答异常
    if (question.type === 'text' && typeof answer === 'string') {
      const trimmedAnswer = answer.trim();
      
      // 检测回答过短
      if (trimmedAnswer.length < 3) {
        warnings.push(`第 ${questionNumber} 题回答过短`);
      }
      
      // 检测重复字符（可能是随意输入）
      if (trimmedAnswer.length > 5) {
        const uniqueChars = new Set(trimmedAnswer);
        if (uniqueChars.size / trimmedAnswer.length < 0.3) {
          anomalies.push(`第 ${questionNumber} 题回答内容重复性较高`);
        }
      }
      
      // 检测常见无效回答
      const invalidPatterns = ['不知道', '不清楚', '无', '没有', '。。。', '...'];
      if (invalidPatterns.some(pattern => 
        trimmedAnswer.toLowerCase().includes(pattern.toLowerCase())
      )) {
        warnings.push(`第 ${questionNumber} 题回答可能无效`);
      }
    }
    
    // 检测选择题异常模式
    if ((question.type === 'radio' || question.type === 'checkbox') && question.options) {
      // 检测是否总是选择第一个选项
      if (question.type === 'radio' && answer === question.options[0]) {
        warnings.push(`第 ${questionNumber} 题选择了第一个选项`);
      }
      
      // 检测多选题选择所有选项
      if (question.type === 'checkbox' && Array.isArray(answer) && 
          answer.length === question.options.length) {
        anomalies.push(`第 ${questionNumber} 题选择了所有选项`);
      }
      
      // 检测多选题只选一个选项（可能是误操作）
      if (question.type === 'checkbox' && Array.isArray(answer) && 
          answer.length === 1 && question.options.length > 2) {
        warnings.push(`第 ${questionNumber} 题在多选题中只选择了一个选项`);
      }
    }
  });
  
  // 检测整体回答模式
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = survey.questions.length;
  
  if (totalAnswered < totalQuestions * 0.3) {
    warnings.push('回答的问题数量较少，请确保完成所有重要问题');
  }
  
  // 检测回答速度异常（如果有时间数据）
  if (answers._completionTime) {
    const completionTime = answers._completionTime;
    const avgTimePerQuestion = completionTime / totalAnswered;
    if (avgTimePerQuestion < 2) { // 平均每题少于2秒
      anomalies.push('回答速度过快，可能存在随意填写的情况');
    }
  }
  
  return { warnings, anomalies };
};

/**
 * 验证回答完整性
 * @param {Object} survey 问卷数据
 * @param {Object} answers 用户回答
 * @returns {Object} 包含 isValid 和 errors 的对象
 */
export const validateResponseCompleteness = (survey, answers) => {
  const errors = [];
  
  if (!survey.questions) {
    errors.push('问卷数据异常');
    return { isValid: false, errors };
  }

  survey.questions.forEach((question, index) => {
    const questionNumber = index + 1;
    
    if (question.required) {
      const answer = answers[question.id];
      let isEmpty = false;
      
      if (!answer) {
        isEmpty = true;
      } else if (typeof answer === 'string' && answer.trim() === '') {
        isEmpty = true;
      } else if (Array.isArray(answer) && answer.length === 0) {
        isEmpty = true;
      } else if (question.type === 'file' && (!answer || !answer.url)) {
        isEmpty = true;
      }
      
      if (isEmpty) {
        errors.push(`第 ${questionNumber} 题 "${question.title}" 是必填问题`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};