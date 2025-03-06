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
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = '文章内容.docx';
        link.click();
        window.URL.revokeObjectURL(link.href);
      }

      // 下载图片
      for (let i = 0; i < imageLinks.length; i++) {
        const response = await axios.get(`/api/proxy-download?url=${encodeURIComponent(imageLinks[i])}`, {
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/zip' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `图片${i + 1}.zip`;
        link.click();
        window.URL.revokeObjectURL(link.href);
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
