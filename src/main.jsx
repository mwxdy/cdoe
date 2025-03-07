import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// 配置axios的baseURL
axios.defaults.baseURL = window.location.origin || 'http://localhost:3000';

// 确保所有请求都使用相对路径，不会被外部域名覆盖
axios.interceptors.request.use(config => {
  // 如果URL以http://或https://开头，且不是指向当前域名，则修改为相对路径
  if (config.url && config.url.startsWith('/api')) {
    // 已经是相对路径，保持不变
    return config;
  }
  
  // 确保API请求路径正确，特别是在生产环境中
  if (config.url && !config.url.startsWith('/') && !config.url.startsWith('http')) {
    config.url = `/${config.url}`;
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
