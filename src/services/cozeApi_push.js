import axios from 'axios';
import { API_CONFIG, replaceUrlParams } from '../config/api.config';

const pollResult = async (executeId, maxAttempts = 25, interval = 25000) => {
  let attempts = 0;
  
  console.log('开始轮询结果，execute_id:', executeId);
  
  while (attempts < maxAttempts) {
    const url = replaceUrlParams(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.RUN_HISTORIES, {
      workflowId: API_CONFIG.WORKFLOW_IDS.PUSH_ARTICLE,
      executeId
    });
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${API_CONFIG.API_TOKEN}`
      }
    });
  
    if (response.data.code === 0 && response.data.data && response.data.data[0]) {
      const result = response.data.data[0];
      const status = result.execute_status;
      console.log(`轮询进度: 第${attempts + 1}次尝试, 状态: ${status}`);
      console.log(`调试URL: https://www.coze.cn/work_flow?execute_id=${executeId}&space_id=7408183695611527187&workflow_id=7488357618043633690`);
  
      if (status === 'Success') {
        console.log('获取结果成功，execute_id:', executeId);
        return { content: result.output, status: 'success' };
      } else if (status === 'Running') {
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
        continue;
      } else if (status === 'Fail') {
        console.error('执行失败，execute_id:', executeId);
        return { content: '生成失败，请重试', status: 'error' };
      }
    }
  }
  return { content: '生成超时，请重试', status: 'error' };
};  
export const generateArticle = async (appId, appSecret, style) => {
  try {
    const response = await axios.post('/api/coze/push/execute', {
      workflow_id: API_CONFIG.WORKFLOW_IDS.PUSH_ARTICLE,
      parameters: {
        app_id: appId,
        AppSecret: appSecret,
        input: `生成一篇${style}的文章`
      },
      is_async: true
    });
    
    // 检查响应状态
    if (response.data.code === 0) {
      const executeId = response.data.execute_id;
      console.log('成功获取execute_id:', executeId);
      return await pollResult(executeId);
    } else {
      const errorMsg = response.data.msg || '生成文章失败';
      console.error('API错误:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('生成文章失败:', error);
    throw error;
  }
};