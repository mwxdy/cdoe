// API配置文件

export const API_CONFIG = {
  // API基础URL
  BASE_URL: 'https://api.coze.cn/v1',
  
  // 图文工作流ID
  WORKFLOW_IDS: {
    COMMAND: '7486288371548586011',
    PUSH_ARTICLE: '7488357618043633690'
  },
  
  // API认证令牌
  API_TOKEN: 'pat_qNV3Pxk147MNj2HFd5DBYqTQUveDQA3XUQ8IQoPIQOE9rAVZYI5x5aJJMEgAvwRZ',
  
  // 轮询配置
  POLLING: {
    MAX_ATTEMPTS: 25,
    INTERVAL: 25000 // 毫秒
  },
  
  // API端点
  ENDPOINTS: {
    WORKFLOW_RUN: '/workflow/run',
    RUN_HISTORIES: '/workflows/{workflowId}/run_histories/{executeId}'
  }
};

// 工具函数：替换URL中的参数
export const replaceUrlParams = (url, params) => {
  let result = url;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
};