// AI 配置检查工具
export const checkAIConfig = () => {
  const config = {
    hasApiKey: !!process.env.REACT_APP_ALIYUN_API_KEY,
    service: process.env.REACT_APP_AI_SERVICE || 'aliyun',
    maxSuggestions: parseInt(process.env.REACT_APP_MAX_SUGGESTIONS) || 3
  };

  console.log('🤖 AI 配置检查:', config);
  
  if (!config.hasApiKey) {
    console.warn('⚠️ 未配置阿里云API密钥，将使用模拟数据');
  } else {
    console.log('✅ AI 服务已配置');
  }

  return config;
};