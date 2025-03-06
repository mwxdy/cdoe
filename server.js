import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 代理下载请求
app.get('/api/proxy-download', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }

    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'stream',
    });

    // 设置响应头
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment');

    // 将文件流传输到客户端
    response.data.pipe(res);
  } catch (error) {
    console.error('代理下载失败:', error);
    res.status(500).json({ error: '下载失败' });
  }
});

// 提供静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// Coze API路由
app.post('/api/coze/session', async (req, res) => {
  try {
    // 这里可以实现会话初始化逻辑
    res.json({ success: true, sessionId: Date.now().toString() });
  } catch (error) {
    console.error('Session initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

app.post('/api/coze/execute', async (req, res) => {
  try {
    // 转发请求到Coze API
    const response = await axios.post('https://api.coze.cn/v1/workflow/run', {
      workflow_id: "7472927343000322086",
      parameters: req.body.parameters,
      is_async: true
    }, {
      headers: {
        'Authorization': 'Bearer pat_4FSfM58XkK4D0aavf5wFlsl60ZUzoCi1oO1wBBu8PSY7YOQiAZOSfUP6tNlRnM0m',
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

app.get('/api/coze/result/:executeId', async (req, res) => {
  try {
    // 转发请求到Coze API
    const response = await axios.get(`https://api.coze.cn/v1/workflows/7472927343000322086/run_histories/${req.params.executeId}`, {
      headers: {
        'Authorization': 'Bearer pat_4FSfM58XkK4D0aavf5wFlsl60ZUzoCi1oO1wBBu8PSY7YOQiAZOSfUP6tNlRnM0m'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Failed to get result' });
  }
});

// 所有其他请求返回React应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});