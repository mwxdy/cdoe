import axios from 'axios';

const API_BASE_URL = 'https://api.coze.cn/v1/workflow/run';

export const initSession = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/session`);
    return response.data;
  } catch (error) {
    console.error('初始化会话失败:', error);
    throw error;
  }
};

export const executeCommand = async (command, options) => {
  try {
    const response = await axios.post(API_BASE_URL, {
      workflow_id: "7472927343000322086",
      parameters: {
        input: [command]
      },
      is_async: true
    }, {
      headers: {
        'Authorization': 'Bearer pat_4FSfM58XkK4D0aavf5wFlsl60ZUzoCi1oO1wBBu8PSY7YOQiAZOSfUP6tNlRnM0m',
        'Content-Type': 'application/json'
      }
    });
    
    // 检查响应状态
    if (response.data.code === 0) {
      // 存储execute_id用于后续获取结果
      const executeId = response.data.execute_id;
      console.log('成功获取execute_id:', executeId);
      // 轮询获取结果
      return await pollResult(executeId);
    } else {
      throw new Error(response.data.msg || '执行命令失败');
    }
  } catch (error) {
    console.error('执行命令失败:', error);
    throw error;
  }
};

const pollResult = async (executeId, maxAttempts = 25, interval = 50000) => {
  let attempts = 0;
  
  console.log('开始轮询结果，execute_id:', executeId);
  
  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(`https://api.coze.cn/v1/workflows/7472927343000322086/run_histories/${executeId}`, {
        headers: {
          'Authorization': 'Bearer pat_4FSfM58XkK4D0aavf5wFlsl60ZUzoCi1oO1wBBu8PSY7YOQiAZOSfUP6tNlRnM0m'
        }
      });
      
      if (response.data.code === 0 && response.data.data && response.data.data[0]) {
        const result = response.data.data[0];
        const status = result.execute_status;
        console.log(`轮询进度: 第${attempts + 1}次尝试, 状态: ${status}`);
        
        if (status === 'Success') {
          console.log('获取结果成功，execute_id:', executeId);
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
          return { content: '生成失败，请重试', status: 'error' };
        }
      }
    } catch (error) {
      console.error('获取结果失败:', error);
      return { content: '获取结果失败，请重试', status: 'error' };
    }
  }
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