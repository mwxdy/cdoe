import React, { useState } from 'react';
import { Button, message } from 'antd';
import axios from 'axios';
import QuickGenPanel from './components/QuickGenPanel';
import ResultArea from './components/ResultArea';
import { executeCommand } from './services/cozeApi';
import './App.css';

function App() {
  const [settings, setSettings] = useState({ style: '', command: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleSettingsChange = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

  const downloadFiles = async (content) => {
    try {
      setDownloading(true);
      // 提取Word文档链接
      const wordMatch = content.match(/WORD链接：(.*?)\n/s);
      const wordUrl = wordMatch ? wordMatch[1] : null;

      // 提取图片链接数组
      const imageLinksMatch = content.match(/图片：(\[.*?\])/s);
      const imageLinks = imageLinksMatch ? JSON.parse(imageLinksMatch[1]) : [];

      // 下载Word文档
      if (wordUrl) {
        const response = await axios.get(`/api/proxy-download?url=${encodeURIComponent(wordUrl)}`, {
          responseType: 'blob'
        });
        
        // 获取文件名
        let fileName = 'document.docx';
        const xFilename = response.headers['x-filename'];
        if (xFilename) {
          fileName = xFilename;
        } else {
          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=(([\'"]).+?\2|[^;\n]*)/i.exec(contentDisposition);
            if (matches && matches[1]) {
              fileName = matches[1].replace(/[\'"]*/, '');
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
          
          // 如果仍然没有获取到有效文件名，从URL中提取
          if (!fileName.includes('.')) {
            try {
              const urlObj = new URL(wordUrl);
              const pathSegments = urlObj.pathname.split('/');
              const urlFileName = pathSegments[pathSegments.length - 1];
              if (urlFileName && urlFileName.includes('.')) {
                fileName = urlFileName;
              }
            } catch (e) {
              console.error('URL解析失败:', e);
            }
          }
        }
        
        // 创建下载链接
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      // 下载图片
      for (let i = 0; i < imageLinks.length; i++) {
        const response = await axios.get(`/api/proxy-download?url=${encodeURIComponent(imageLinks[i])}`, {
          responseType: 'blob'
        });
        
        // 获取文件名
        let fileName = `image_${i+1}.png`;
        const xFilename = response.headers['x-filename'];
        if (xFilename) {
          fileName = xFilename;
        } else {
          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=(([\'"]).+?\2|[^;\n]*)/i.exec(contentDisposition);
            if (matches && matches[1]) {
              fileName = matches[1].replace(/[\'"]*/, '');
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
          
          // 如果仍然没有获取到有效文件名，从URL中提取
          if (!fileName.includes('.')) {
            try {
              const urlObj = new URL(imageLinks[i]);
              const pathSegments = urlObj.pathname.split('/');
              const urlFileName = pathSegments[pathSegments.length - 1];
              if (urlFileName && urlFileName.includes('.')) {
                fileName = urlFileName;
              } else {
                // 尝试从URL中的关键词识别图片类型
                if (imageLinks[i].includes('png')) {
                  fileName = `image_${i+1}.png`;
                } else if (imageLinks[i].includes('jpg') || imageLinks[i].includes('jpeg')) {
                  fileName = `image_${i+1}.jpg`;
                } else if (imageLinks[i].includes('gif')) {
                  fileName = `image_${i+1}.gif`;
                } else {
                  // 从Content-Type中获取
                  const contentType = response.headers['content-type'];
                  if (contentType && contentType.startsWith('image/')) {
                    const ext = contentType.split('/').pop();
                    fileName = `image_${i+1}.${ext}`;
                  }
                }
              }
            } catch (e) {
              console.error('URL解析失败:', e);
            }
          }
        }
        
        // 创建下载链接
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      message.success('文件下载完成');
    } catch (error) {
      console.error('下载文件失败:', error);
      message.error(`下载文件失败: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerate = async () => {
    if (!settings.command) {
      message.warning('请选择文章风格');
      return;
    }

    setLoading(true);
    setResult('生成中，请耐心等待20分钟...');
    try {
      const response = await executeCommand(settings.command, settings);
      setResult(response.content);
      // 自动下载生成的文件
      await downloadFiles(response.content);
    } catch (error) {
      message.error('生成失败，请重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <QuickGenPanel onSettingsChange={handleSettingsChange} />
      <Button 
        type="primary" 
        onClick={handleGenerate} 
        loading={loading || downloading}
        style={{ marginBottom: 20, width: '100%' }}
      >
        {downloading ? '下载文件中...' : '生成文章'}
      </Button>
      <ResultArea content={result} loading={loading} />
    </div>
  );
}

export default App;
