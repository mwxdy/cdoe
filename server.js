import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

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
      timeout: 60000,
      maxContentLength: 100 * 1024 * 1024, // 100MB
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      },
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    // 从URL中提取原始文件名，保留完整的文件名和扩展名
    const urlObj = new URL(decodeURIComponent(url));
    const pathSegments = urlObj.pathname.split('/');
    let fileName = pathSegments[pathSegments.length - 1];
    
    // 处理URL中的查询参数，某些下载链接可能将真实文件名放在查询参数中
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      // 检查常见的文件名参数
      for (const param of ['filename', 'file', 'name', 'download']) {
        if (params.has(param) && params.get(param)) {
          const paramValue = params.get(param);
          if (paramValue.includes('.')) {
            fileName = paramValue;
            break;
          }
        }
      }
    }
    
    // 如果URL中没有文件名，尝试从Content-Disposition中获取
    if (!fileName || fileName === '' || !fileName.includes('.')) {
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        // 尝试提取标准文件名
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = matches[1].replace(/['"]*/g, '');
        }
        
        // 尝试提取UTF-8编码的文件名 (filename*=UTF-8''encoded-filename)
        if (!fileName.includes('.')) {
          const filenameStarRegex = /filename\*=([^']*)'([^']*)'([^;\n]*)/i;
          const starMatches = filenameStarRegex.exec(contentDisposition);
          if (starMatches && starMatches[3]) {
            try {
              fileName = decodeURIComponent(starMatches[3]);
            } catch (e) {
              console.error('解码文件名失败:', e);
            }
          }
        }
      }
    }

    // 如果仍然没有文件名，使用默认值
    fileName = fileName || 'downloaded-file';

    // 确保文件名中包含扩展名
    if (!fileName.includes('.')) {
      // 尝试从Content-Type中获取扩展名
      const contentType = response.headers['content-type'];
      if (contentType) {
        const ext = contentType.split('/').pop();
        if (ext && ext !== 'octet-stream') {
          fileName = `${fileName}.${ext}`;
        } else {
          // 如果无法从Content-Type获取有效扩展名，根据URL中的特征添加扩展名
          if (url.includes('docx') || url.includes('document')) {
            fileName = `${fileName}.docx`;
          } else if (url.includes('xlsx') || url.includes('spreadsheet')) {
            fileName = `${fileName}.xlsx`;
          } else if (url.includes('pdf')) {
            fileName = `${fileName}.pdf`;
          } else if (url.includes('zip')) {
            fileName = `${fileName}.zip`;
          } else {
            // 默认添加二进制文件扩展名
            fileName = `${fileName}.bin`;
          }
        }
      }
    }

    // 设置Content-Type
    const fileExtension = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'txt': 'text/plain',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'bin': 'application/octet-stream'
    };

    let contentType = mimeTypes[fileExtension] || response.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // 设置Content-Disposition，强制浏览器直接下载
    // 添加noopen参数以阻止浏览器询问打开方式
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}; noopen`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // 添加自定义头，确保文件名和扩展名能被前端正确识别
    res.setHeader('X-Filename', fileName);

    // 将文件流传输到客户端
    response.data.pipe(res);
  } catch (error) {
    console.error('代理下载失败:', error);
    const errorMessage = error.response
      ? `下载失败: HTTP ${error.response.status} - ${error.response.statusText}`
      : error.code === 'ECONNABORTED'
      ? '下载超时'
      : `下载失败: ${error.message}`;
    res.status(500).json({ error: errorMessage });
  }
});


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

// 确保所有其他路由都返回index.html（SPA应用需要）
app.get('*', (req, res) => {
  // 对于非API请求，返回前端应用
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});