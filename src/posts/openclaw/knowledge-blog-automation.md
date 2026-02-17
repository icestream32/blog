---
title: 知识博客自动化流程
isOriginal: true
order: 13
category:
    - 计算机
    - 知识管理
tag:
    - OpenClaw
    - 知识管理
    - 自动化
    - 博客
    - VuePress
---

基于 OpenClaw 搭建的端到端知识博客自动化流程，实现了从原始对话记录到技术博客文章的全自动生成。

<!-- more -->

## 整体架构

```
raw_input/           →  原始对话记录（ChatGPT/Cursor 导出）
     ↓
knowledge-extractor  →  知识提取
     ↓
knowledge_base/      →  结构化知识（JSON）
     ↓
blog-generator       →  博客生成
     ↓
blog_repo            →  博客仓库（分支）
     ↓
GitHub PR            →  Pull Request
     ↓
合并发布              →  Master/Main 分支
```

## 详细流程

### 1. 准备阶段

将 ChatGPT/Cursor 对话导出为 Markdown 文件，保存到 `raw_input/` 目录。

### 2. 知识提取

knowledge-extractor 读取原始对话，使用 LLM 提取结构化知识，输出 JSON 到 `knowledge_base/`。

提取的知识包含：
- topic（主题）
- tag（标签）
- category（分类）
- commands（命令）
- examples（示例）
- definition（定义）
- references（参考）

### 3. 博客生成

blog-generator 读取 `knowledge_base/*.json`，根据模板生成 VuePress 格式的 Markdown 文章。

每篇文章包含：
- Frontmatter 元数据
- 摘要和正文
- 代码示例
- 延伸阅读

### 4. PR 创建

自动创建分支、提交、推送，并通过 `gh pr create` 发起 Pull Request。

## 自动化触发

### 手动触发

通过 Telegram 发送消息给绑定的 blog agent。

### 定时触发

配置 Cron 任务自动执行：

```json
{
  "name": "daily_blog_extract",
  "schedule": "0 2 * * *",
  "agentId": "blog"
}
```

## 相关配置

### Telegram 配置

```json
{
  "match": { "channel": "telegram" },
  "agentId": "blog"
}
```

### Gateway 管理

```bash
openclaw gateway restart
openclaw gateway status
```

## 延伸阅读

::: info

- [VuePress 官方文档](https://vuepress.vuejs.org/)
- [Git 官方文档](https://git-scm.com/doc)
- [OpenClaw 官方文档](/openclaw-docs)
- [Markdown Guide](https://www.markdownguide.org/)

:::
