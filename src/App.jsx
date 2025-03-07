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
      // 提取下载链接
      const linkMatch = content.match(/下载链接：(.*?)(?:\n|$)/s);
      const downloadUrl = linkMatch ? linkMatch[1].trim() : null;

      if (downloadUrl) {
        const response = await axios.get(`/api/proxy-download?url=${encodeURIComponent(downloadUrl)}`, {
          responseType: 'blob'
        });
        
        // 获取文件名
        let fileName = 'download.zip';
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
            
            // 尝试提取UTF-8编码的文件名
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
              const urlObj = new URL(downloadUrl);
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
        const downloadLink = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadLink;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadLink);

        message.success('文件下载完成');
      } else {
        message.error('未找到下载链接');
      }
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
