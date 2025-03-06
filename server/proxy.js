import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = 3000;

// 启用CORS
app.use(cors());

// 代理下载请求
app.get('/proxy-download', async (req, res) => {
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

app.listen(port, () => {
  console.log(`代理服务器运行在 http://localhost:${port}`);
});