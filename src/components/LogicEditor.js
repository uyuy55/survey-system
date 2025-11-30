// components/LogicEditor.js
import React from 'react';

const LogicEditor = ({ question, onUpdate, survey }) => {
  const updateLogic = (option, targetQuestionId) => {
    const newLogic = { ...question.logic };
    if (targetQuestionId) {
      newLogic[option] = targetQuestionId;
    } else {
      delete newLogic[option];
    }
    onUpdate({ logic: newLogic });
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

export default LogicEditor;