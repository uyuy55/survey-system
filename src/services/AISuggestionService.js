class AISuggestionService {
  constructor() {
    this.apiKey = process.env.REACT_APP_ALIYUN_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    this.model = 'qwen-turbo';
  }

  /**
   * 核心的 AI 调用方法
   */
  async generateQuestionSuggestions(keywords, questionType, count = 3) {
    // 1. 检查 API 密钥
    if (!this.apiKey) {
      console.warn('未配置 API 密钥，使用模拟数据');
      return this.getMockSuggestions(keywords, questionType, count);
    }

    try {
      // 2. 构建请求数据
      const requestData = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(keywords, questionType, count)
          }
        ],
        stream: false,
        temperature: 0.7
      };

      console.log('🚀 发送 AI 请求...');

      // 3. 发送 HTTP 请求到阿里云 API
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      // 4. 检查响应状态
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      // 5. 解析响应数据
      const data = await response.json();
      console.log('✅ AI 响应成功');

      // 6. 提取和处理返回的建议
      return this.extractSuggestions(data);

    } catch (error) {
      console.error('❌ AI 调用失败:', error.message);
      // 失败时返回模拟数据
      return this.getMockSuggestions(keywords, questionType, count);
    }
  }

  /**
   * 构建给 AI 的提示词
   */
  buildPrompt(keywords, questionType, count) {
    const typeNames = {
      radio: '单选题',
      checkbox: '多选题', 
      text: '填空题',
      file: '文件上传题'
    };

    return `你是一个专业的问卷设计专家。请根据关键词"${keywords}"生成${count}个${typeNames[questionType]}。

具体要求：
1. 返回格式必须是严格的 JSON 数组
2. 每个问题对象包含两个字段：title 和 options
3. title 是问题标题，要专业且清晰
4. options 是选项数组：
   - 如果是选择题（单选/多选），提供 3-5 个具体选项
   - 如果是填空题或文件题，options 设为空数组 []

返回示例：
[
  {
    "title": "您使用该产品的频率是？",
    "options": ["每天使用", "每周使用", "每月使用", "很少使用"]
  }
]

请只返回 JSON 数据，不要其他说明文字。`;
  }

  /**
   * 从 AI 响应中提取建议
   */
  extractSuggestions(responseData) {
    try {
      // 获取 AI 返回的文本内容
      let content = '';
      if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
        content = responseData.choices[0].message.content;
      } else {
        throw new Error('无法识别的响应格式');
      }

      console.log('📝 AI 返回内容:', content);

      // 提取 JSON 部分
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('未找到 JSON 数据');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      
      // 验证数据格式
      if (!Array.isArray(suggestions)) {
        throw new Error('返回数据不是数组');
      }

      return suggestions;
      
    } catch (error) {
      console.error('解析 AI 响应失败:', error);
      throw new Error('处理 AI 响应时出错');
    }
  }

  /**
   * 模拟数据（备用方案）
   */
  getMockSuggestions(keywords, questionType, count) {
    const suggestions = {
      radio: [
        {
          title: `关于"${keywords}"，您的使用频率是？`,
          options: ['每天使用', '每周使用', '每月使用', '很少使用', '从未使用']
        },
        {
          title: `您对"${keywords}"的满意度如何？`,
          options: ['非常满意', '满意', '一般', '不满意', '非常不满意']
        },
        {
          title: `您主要通过什么渠道了解"${keywords}"？`,
          options: ['朋友推荐', '广告宣传', '社交媒体', '新闻报道', '其他渠道']
        }
      ],
      checkbox: [
        {
          title: `您喜欢"${keywords}"的哪些方面？`,
          options: ['功能实用', '设计美观', '价格合理', '服务周到', '品牌信誉', '其他']
        },
        {
          title: `您认为"${keywords}"需要在哪些方面改进？`,
          options: ['功能增强', '性能优化', '用户体验', '价格调整', '客户服务', '其他']
        }
      ],
      text: [
        {
          title: `请描述您对"${keywords}"的使用体验`,
          options: []
        },
        {
          title: `您对"${keywords}"有什么建议或意见？`,
          options: []
        }
      ],
      file: [
        {
          title: `请上传与"${keywords}"相关的图片`,
          options: []
        }
      ]
    };
    
    return suggestions[questionType]?.slice(0, count) || [];
  }
}

export default new AISuggestionService();