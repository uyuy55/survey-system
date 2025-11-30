// utils/validation.js

/**
 * 检测问卷中的异常情况
 * @param {Object} survey 问卷数据
 * @returns {Object} 包含 isValid 和 errors 的对象
 */
export const validateSurvey = (survey) => {
  const errors = [];
  
  if (!survey.title || survey.title.trim() === '') {
    errors.push('问卷标题不能为空');
  }
  
  if (!survey.questions || survey.questions.length === 0) {
    errors.push('问卷至少需要一个问题');
    return { isValid: errors.length === 0, errors };
  }
  
  // 检查每个问题
  survey.questions.forEach((question, index) => {
    const questionNumber = index + 1;
    
    // 检查问题标题
    if (!question.title || question.title.trim() === '') {
      errors.push(`第 ${questionNumber} 个问题缺少标题`);
    }
    
    // 检查选择题选项
    if (question.type === 'radio' || question.type === 'checkbox') {
      if (!question.options || question.options.length === 0) {
        errors.push(`第 ${questionNumber} 个问题缺少选项`);
        return;
      }
      
      // 检查选项是否为空
      const emptyOptions = question.options.filter(option => !option || option.trim() === '');
      if (emptyOptions.length > 0) {
        errors.push(`第 ${questionNumber} 个问题有 ${emptyOptions.length} 个空选项`);
      }
      
      // 检查重复选项
      const trimmedOptions = question.options.map(option => option.trim().toLowerCase());
      const uniqueOptions = [...new Set(trimmedOptions)];
      if (uniqueOptions.length !== trimmedOptions.length) {
        errors.push(`第 ${questionNumber} 个问题有重复选项`);
      }
      
      // 检查所有选项是否相同
      if (trimmedOptions.length > 1 && trimmedOptions.every(option => option === trimmedOptions[0])) {
        errors.push(`第 ${questionNumber} 个问题的所有选项都相同，请修改选项内容`);
      }
      
      // 检查选项数量
      if (question.options.length < 2) {
        errors.push(`第 ${questionNumber} 个问题至少需要 2 个选项`);
      }
    }
    
    // 检查文件上传题设置
    if (question.type === 'file') {
      if (question.maxSize && (question.maxSize < 1 || question.maxSize > 100)) {
        errors.push(`第 ${questionNumber} 个问题的文件大小限制应在 1-100MB 之间`);
      }
    }
  });
  
  // 检查问题逻辑跳转循环
  const logicErrors = detectLogicCycles(survey.questions);
  errors.push(...logicErrors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 检测逻辑跳转中的循环引用
 * @param {Array} questions 问题列表
 * @returns {Array} 错误信息数组
 */
const detectLogicCycles = (questions) => {
  const errors = [];
  
  questions.forEach((question, index) => {
    if (!question.logic) return;
    
    Object.values(question.logic).forEach(targetQuestionId => {
      const targetQuestion = questions.find(q => q.id === targetQuestionId);
      if (targetQuestion && hasCycle(questions, targetQuestion.id, question.id)) {
        errors.push(`第 ${index + 1} 个问题的逻辑跳转存在循环引用`);
      }
    });
  });
  
  return errors;
};

/**
 * 检测从起始问题到目标问题是否存在循环
 * @param {Array} questions 问题列表
 * @param {String} currentId 当前问题ID
 * @param {String} targetId 目标问题ID
 * @param {Set} visited 已访问的问题ID集合
 * @returns {Boolean} 是否存在循环
 */
const hasCycle = (questions, currentId, targetId, visited = new Set()) => {
  if (currentId === targetId) return true;
  if (visited.has(currentId)) return false;
  
  visited.add(currentId);
  const currentQuestion = questions.find(q => q.id === currentId);
  
  if (!currentQuestion || !currentQuestion.logic) return false;
  
  // 检查所有逻辑跳转目标
  for (const nextId of Object.values(currentQuestion.logic)) {
    if (hasCycle(questions, nextId, targetId, visited)) {
      return true;
    }
  }
  
  return false;
};

/**
 * 获取问题类型的显示名称
 * @param {String} type 问题类型
 * @returns {String} 显示名称
 */
export const getQuestionTypeName = (type) => {
  const types = {
    radio: '单选题',
    checkbox: '多选题',
    text: '填空题',
    file: '文件上传题'
  };
  return types[type] || type;
};