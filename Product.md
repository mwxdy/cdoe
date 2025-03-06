# 家居自动化文章生成器 - MVP产品设计手册

## 产品概述

基于您的需求，我们将设计一个简洁的网页应用，允许用户通过输入框输入命令，调用Coze工作流进行家居自动化文章的生成，并将结果返回显示。

## 功能规划

### 核心功能
1. **快捷生成面板**：顶部显示快速生成选项（如图所示的文章数量、文章风格选择器）
3. **异步调用**：连接Coze工作流API，异步执行命令
4. **结果展示**：将生成的内容返回并展示在结果区域

### 用户流程
1. 用户访问网页
2. 选择快捷设置或直接在输入框中输入命令
3. 点击生成按钮
4. 系统显示加载状态
5. 接收Coze工作流返回的结果并展示

## 技术选型

### 前端技术栈
- **框架**：React.js（轻量级、组件化、生态丰富）
- **UI库**：Ant Design（美观、易用的UI组件库）
- **状态管理**：React Context API（简单应用无需Redux）
- **HTTP请求**：Axios（处理API调用）

### 后端技术栈
- **服务框架**：Express.js（轻量级Node.js框架）
- **API集成**：与Coze API对接
- **部署**：可选择Vercel或Netlify进行简单部署

## 项目脚手架

推荐使用Create React App (CRA)作为脚手架，快速搭建React应用：

```bash
pnpm create-react-app .
```

## 项目结构

```
d:\WORK\COZE_家居自动化文章\web_xhs\
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── QuickGenPanel.js     # 快速生成面板组件
│   │   ├── InputArea.js         # 输入区域组件
│   │   ├── ResultArea.js        # 结果展示区域
│   │   └── LoadingIndicator.js  # 加载指示器
│   ├── services/
│   │   └── cozeApi.js           # Coze API调用服务
│   ├── App.js                   # 主应用组件
│   ├── App.css                  # 应用样式
│   ├── index.js                 # 入口文件
│   └── index.css                # 全局样式
├── server/                      # 可选后端服务
│   └── index.js                 # Express服务器
├── package.json
└── README.md
```

## 界面设计

### 主界面
- 顶部：快捷生成面板（如您图片所示）
- 中部：输入框区域（大型文本框）
- 底部：生成按钮和结果展示区域

### 交互设计
- 快捷面板选项变更时实时更新输入内容
- 生成按钮点击后显示加载动画
- 结果返回后平滑过渡显示

## API设计

### 与Coze的集成
需要实现以下API调用：

1. **初始化Coze会话**
   ```
   POST /api/coze/session
   ```

2. **发送命令到Coze**
   ```
   POST /api/coze/execute
   Body: { command: "用户输入", options: { articleCount: 1, style: "奶油风" } }
   ```

3. **获取生成结果**
   ```
   GET /api/coze/result/:sessionId
   ```

## 实现步骤

1. **搭建基础项目**
   - 使用CRA创建React项目
   - 安装必要依赖（Ant Design, Axios等）

2. **开发前端组件**
   - 实现快捷生成面板
   - 实现输入区域
   - 实现结果展示区域

3. **实现API服务**
   - 创建与Coze通信的服务层
   - 处理异步调用和结果返回

4. **集成测试**
   - 测试完整流程
   - 优化用户体验

## 后续优化方向

1. **用户体验提升**
   - 添加历史记录功能
   - 支持模板保存和复用

2. **功能扩展**
   - 支持更多文章风格
   - 添加文章预览功能

3. **性能优化**
   - 实现结果缓存
   - 优化加载速度

## 开发时间估计

- 基础框架搭建：1天
- 前端组件开发：2天
- API集成：1-2天
- 测试与优化：1天

总计：5-6个工作日可完成MVP版本

是否需要我为您提供具体的代码实现示例？