import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '仅支持GET请求' });
  }

  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }

    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'arraybuffer',
    });

    // 设置响应头
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment');

    // 返回文件内容
    res.send(response.data);
  } catch (error) {
    console.error('代理下载失败:', error);
    res.status(500).json({ error: '下载失败' });
  }
}