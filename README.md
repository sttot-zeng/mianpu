# 面谱 — AI 驱动的面试辅助系统

让每一次面试准备都有据可依。

## 概述

面谱是一款自用的 AI 驱动面试辅助 Web 应用。上传一次简历，结合招聘信息（JD），自动输出**个人能力画像、岗位匹配分析、定制面试题库**三个维度的结构化信息，帮助求职者高效准备面试。

## 功能

| 模块 | 功能 | 说明 |
|------|------|------|
| 📋 个人档案 | 简历上传 / AI 解析 / 能力模型 | 支持 PDF/DOCX，自动提取结构化信息并生成 5 维能力雷达图 |
| 🔍 岗位分析 | JD 解析 / 公司分析 / 匹配度 / 补齐方案 | 粘贴 JD 即可自动分析，逐项对比简历与岗位要求 |
| 📝 面试题库 | 6 章节定制题库 / 答案显隐 / 模拟练习 | 基于简历+JD 生成，支持收藏、标记、新增题目 |

## 快速开始

### 给普通用户

1. 下载本项目，解压
2. 打开 `面试经/index.html`（建议用 Chrome / Edge）
3. 点击右上角或导航到"个人档案"，配置 AI API Key
4. 上传简历，开始分析岗位

### 配置 AI

面谱支持以下 AI 模型，任选其一配置即可：

| 提供商 | 推荐模型 | 获取 API Key |
|--------|----------|-------------|
| DeepSeek | deepseek-chat | [platform.deepseek.com](https://platform.deepseek.com) |
| 通义千问 | qwen-max | [dashscope.aliyun.com](https://dashscope.aliyun.com) |
| 智谱 GLM | glm-4-flash | [open.bigmodel.cn](https://open.bigmodel.cn) |
| 月之暗面 | moonshot-v1-8k | [platform.moonshot.cn](https://platform.moonshot.cn) |

> 所有数据存储在浏览器本地（localStorage / IndexedDB），不会上传到任何服务器。

## 技术栈

| 层 | 选型 |
|------|------|
| 前端 | 纯 HTML + CSS + Vanilla JS (ES Module) |
| 样式 | 自定义深色主题，CSS 变量驱动 |
| 数据 | localStorage + IndexedDB |
| AI | 自研 AI Adapter 层，支持多模型切换 |
| 部署 | 纯静态，无需服务器 |

## 项目结构

```
面试经/
├── index.html              # 入口（重定向到仪表盘）
├── dashboard.html           # 仪表盘
├── profile.html             # 个人档案
├── analyze-new.html         # 新增分析
├── analyze-detail.html      # 分析详情
├── question-bank.html       # 面试题库
├── css/
│   └── main.css             # 共享样式表
└── js/
    ├── app.js               # 应用入口与共享工具
    ├── storage.js            # 数据持久化层
    ├── ai-adapter.js         # AI 适配器（多模型）
    ├── resume.js             # 简历模块
    ├── analyze.js            # 分析模块
    └── questions.js          # 题库模块
```

## 隐私说明

- 所有用户数据（简历、分析记录、题库、API Key）均存储在**浏览器本地**
- 不会上传到任何第三方服务器，仅 AI 分析时会将数据发送到您配置的 AI API
- 分享代码给朋友时，**对方不会看到你的个人数据**

## 开发

本项目基于 [bailan-pm](.agents/ProductSpecBuilder.md) 产品开发框架构建，开发流程详见 `.agents/` 目录下的 Skill 文件。

### 本地开发

直接用浏览器打开 HTML 文件即可，无需构建步骤。建议用 VS Code + Live Server 以获得更好的开发体验。

## License

MIT
