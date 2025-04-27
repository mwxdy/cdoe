import axios from 'axios';
import { API_CONFIG, replaceUrlParams } from '../config/api.config';

export const initSession = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/session`);
    return response.data;
  } catch (error) {
    console.error('初始化会话失败:', error);
    throw error;
  }
};

// 添加系统状态检查函数
export const checkSystemStatus = async () => {
  try {
    const response = await axios.get('/api/system/status');
    return response.data.isProcessing;
  } catch (error) {
    console.error('检查系统状态失败:', error);
    throw error;
  }
};

// 添加释放状态的函数
const releaseSystemState = async () => {
  try {
    await axios.post('/api/system/release');
  } catch (error) {
    console.error('释放系统状态失败:', error);
  }
};

export const executeCommand = async (command, options) => {
  try {
    // 先检查系统状态
    const isProcessing = await checkSystemStatus();
    if (isProcessing) {
      throw new Error('系统正在处理其他用户的请求，请稍后再试');
    }

    const response = await axios.post('/api/coze/execute', {
      workflow_id: API_CONFIG.WORKFLOW_IDS.COMMAND,
      parameters: {
        input: [command]
      },
      is_async: true
    });

    if (response.data.code === 0) {
      const executeId = response.data.execute_id;
      console.log('成功获取execute_id:', executeId);
      return await pollResult(executeId);
    } else {
      const errorMsg = response.data.msg || '执行命令失败';
      console.error('API错误:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('执行命令失败:', error);
    throw error;
  }
};
const pollResult = async (executeId, maxAttempts = API_CONFIG.POLLING.MAX_ATTEMPTS, interval = API_CONFIG.POLLING.INTERVAL) => {
  let attempts = 0;
  
  console.log('开始轮询结果，execute_id:', executeId);
  
  while (attempts < maxAttempts) {
    try {
      const url = replaceUrlParams(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.RUN_HISTORIES, {
        workflowId: API_CONFIG.WORKFLOW_IDS.COMMAND,
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
        console.log(`调试URL: https://www.coze.cn/work_flow?execute_id=${executeId}&space_id=7408183695611527187&workflow_id=${API_CONFIG.WORKFLOW_IDS.COMMAND}`);
        
        if (status === 'Success') {
          console.log('获取结果成功，execute_id:', executeId);
          // 成功获取结果后立即释放状态
          await releaseSystemState();
          try {
            const outputData = JSON.parse(result.output);
            const outputContent = JSON.parse(outputData.Output);
            return { content: outputContent.data, status: 'success' };
          } catch (parseError) {
            console.error('解析输出内容失败:', parseError);
            return { content: '解析结果失败', status: 'error' };
          }
        } else if (status === 'Running') {
          await new Promise(resolve => setTimeout(resolve, interval));
          attempts++;
          continue;
        } else if (status === 'Fail') {
          console.error('执行失败，execute_id:', executeId);
          // 执行失败时也释放状态
          await releaseSystemState();
          return { content: '生成失败，请重试', status: 'error' };
        }
      }
    } catch (error) {
      console.error('获取结果失败:', error.response ? error.response.data : error.message);
      // 发生错误时释放状态
      await releaseSystemState();
      return { content: '获取结果失败，请重试', status: 'error' };
    }
  }
  // 超时时释放状态
  await releaseSystemState();
  return { content: '生成超时，请重试', status: 'error' };
};
export const getResult = async (executeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/result/${executeId}`);
    return response.data;
  } catch (error) {
    console.error('获取结果失败:', error);
    throw error;
  }
};

