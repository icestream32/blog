---
title: Knowledge Extractor Skill
isOriginal: true
order: 9
category:
    - 计算机
    - 知识管理
tag:
    - Skill
    - 知识提取
    - OpenClaw
    - LLM
---

Knowledge Extractor 是 OpenClaw 的核心技能之一，用于从 ChatGPT/Cursor 对话记录中提取结构化技术知识。

<!-- more -->

## 功能概述

Knowledge Extractor 负责将原始对话内容转换为结构化的 JSON 格式，供下游的 blog-generator 使用。

### 主要流程

1. 读取 `raw_input/*.md` 文件（ChatGPT/Cursor 导出的对话记录）
2. 使用 LLM 分析并提取关键技术知识点
3. 输出结构化的 JSON 文件到 `knowledge_base/<topic>.json`

## 输出格式

提取的知识以 JSON 格式保存，包含以下字段：

```json
{
  "topic": "主题名称",
  "tag": ["标签1", "标签2"],
  "category": ["分类1", "分类2"],
  "commands": [
    {"cmd": "命令", "desc": "描述"}
  ],
  "examples": ["使用示例"],
  "definition": "概念定义",
  "references": ["参考资料"]
}
```

## 延伸阅读

- [blog-generator 博客生成器](/blog-generator)
- [知识博客自动化流程](/knowledge-blog-automation)
