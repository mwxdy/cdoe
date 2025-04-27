import React, { useState } from 'react';
import { Button, message } from 'antd';
import QuickGenPanel from './components/QuickGenPanel';
import ResultArea from './components/ResultArea';
import PublishDrawer from './components/PublishDrawer';
import { executeCommand } from './services/cozeApi';
import axios from 'axios';
import './App.css';

// 配置message全局样式
message.config({
  top: 80,
  duration: 3,
  maxCount: 3,
  rtl: false,
});

function App() {
  const [settings, setSettings] = useState({ style: '', command: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleSettingsChange = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

  const downloadFiles = async (content) => {
    try {
      setDownloading(true);
      // 提取下载链接
      // 尝试匹配多种可能的链接格式
      const linkMatch = content.match(/(?:下载链接|链接)：(.*?)(?:\n|$)/s);
      const downloadUrl = linkMatch ? linkMatch[1].trim() : null;

      if (downloadUrl) {
        const response = await axios.get(`/api/proxy-download?url=${encodeURIComponent(downloadUrl)}`, {
          responseType: 'blob'
        });
        
        // 格式化当前时间为指定格式
        const now = new Date();
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          
          return `小红书图文仿写-室内-[${year}/${month}/${day}_${hours}-${minutes}-${seconds}]`;
        };
        
        // 使用自定义格式的文件名
        let fileName = formatDate(now);
        
        // 获取文件扩展名
        const xFilename = response.headers['x-filename'];
        let fileExtension = '';
        
        if (xFilename && xFilename.includes('.')) {
          fileExtension = '.' + xFilename.split('.').pop();
        } else {
          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const matches = /filename[^;=\n]*=(([\'"]).+?\2|[^;\n]*)/i.exec(contentDisposition);
            if (matches && matches[1]) {
              const tempName = matches[1].replace(/[\'"]*/, '');
              if (tempName.includes('.')) {
                fileExtension = '.' + tempName.split('.').pop();
              }
            }
            
            // 尝试提取UTF-8编码的文件名
            if (!fileExtension) {
              const filenameStarRegex = /filename\*=([^']*)'([^']*)'([^;\n]*)/i;
              const starMatches = filenameStarRegex.exec(contentDisposition);
              if (starMatches && starMatches[3]) {
                try {
                  const tempName = decodeURIComponent(starMatches[3]);
                  if (tempName.includes('.')) {
                    fileExtension = '.' + tempName.split('.').pop();
                  }
                } catch (e) {
                  console.error('解码文件名失败:', e);
                }
              }
            }
          }
          
          // 如果仍然没有获取到有效扩展名，从URL中提取
          if (!fileExtension) {
            try {
              const urlObj = new URL(downloadUrl);
              const pathSegments = urlObj.pathname.split('/');
              const urlFileName = pathSegments[pathSegments.length - 1];
              if (urlFileName && urlFileName.includes('.')) {
                fileExtension = '.' + urlFileName.split('.').pop();
              }
            } catch (e) {
              console.error('URL解析失败:', e);
            }
          }
        }
        
        // 如果没有找到扩展名，默认使用.zip
        if (!fileExtension) {
          fileExtension = '.zip';
        }
        
        // 将扩展名添加到文件名
        fileName += fileExtension;
        
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
    setResult('生成中，请耐心等待5分钟...');
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: 20 }}>
        <Button 
          type="primary" 
          onClick={handleGenerate} 
          loading={loading || downloading}
          style={{ flex: 1 }}
        >
          {downloading ? '下载文件中...' : '生成文章'}
        </Button>
        <Button onClick={() => setDrawerVisible(true)} type="default">
          一键发布到公众号
        </Button>
      </div>
      <ResultArea content={result} loading={loading} />
      <PublishDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </div>
  );
}

export default App;
