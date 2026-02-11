# ICESTREAM32 的博客

基于 [VuePress](https://vuepress.vuejs.org/) + [theme-hope](https://theme-hope.vuejs.press/) 构建的个人博客，部署于 [www.icestream32.cn](https://www.icestream32.cn)。

## 技术栈

- **框架**: VuePress 2 (Vite 构建)
- **主题**: vuepress-theme-hope
- **语言**: TypeScript
- **样式**: SCSS

## 内容结构

```
src/
├── posts/          # 博客文章
│   ├── blog-website-creation/   # 博客建站
│   ├── commons/                 # 通用技术
│   └── nas-creation/            # NAS 搭建
├── notes/          # 学习笔记
│   ├── concurrency-in-go/       # Go 并发
│   └── design-patterns/         # 设计模式
└── music/          # 音乐学习
    └── piano-learning/          # 钢琴学习
```

## 快速开始

### 环境要求

- Node.js 20+
- npm

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
# 启动开发服务器
npm run docs:dev

# 清除缓存后启动
npm run docs:clean-dev
```

### 构建

```bash
npm run docs:build
```

构建产物输出至 `src/.vuepress/dist/`。

## 部署

项目通过 GitHub Actions 自动部署：推送代码后，CI 会构建博客并 rsync 到阿里云服务器。

## 脚本命令

| 命令 | 说明 |
|------|------|
| `docs:dev` | 启动开发服务器 |
| `docs:clean-dev` | 清除缓存后启动开发服务器 |
| `docs:build` | 构建生产版本 |
| `docs:update-package` | 更新 VuePress 相关依赖 |

## 功能特性

- 📝 Markdown 增强（数学公式、Mermaid 图表、代码高亮等）
- 🔍 DocSearch 全文搜索
- 💬 Giscus 评论系统
- 📱 响应式设计
- 🌙 深色/浅色主题切换

## 许可证

[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
