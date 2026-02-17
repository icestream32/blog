---
title: Model Context Protocol (MCP) 协议详解
shortTitle: MCP 协议入门
isOriginal: true
order: 1
cover: https://images.icestream32.cn/images/2025/02/17/mcp-protocol-cover.jpg
category:
    - 计算机
    - AI
tag:
    - MCP
    - Model Context Protocol
    - LLM
    - Anthropic
---

Model Context Protocol（MCP）是由 Anthropic 公司于 2024 年 11 月正式发布的开源协议，旨在为大型语言模型（LLM）与外部数据源、工具之间建立标准化、安全的通信桥梁。本文将深入解析 MCP 协议的核心设计理念与技术架构。

<!-- more -->

## 为什么需要 MCP 协议？

在 MCP 出现之前，AI 助手与外部世界的集成面临诸多挑战：

- **碎片化集成**：每个 AI 应用都需要为不同的数据源单独开发适配器
- **安全风险**：AI 可能意外暴露敏感数据或执行危险操作
- **缺乏标准化**：开发者难以复用已有的集成方案
- **扩展困难**：添加新功能需要修改核心代码

MCP 的出现正是为了解决这些问题，它提供了一套统一的协议标准，让 AI 能够安全、可控地访问外部工具和数据源。

## MCP 核心架构

MCP 采用客户端-服务器架构，主要包含三个核心组件：

### 1. MCP Host（宿主）
运行 AI 助手的应用程序，如 Claude Desktop、Cursor IDE 等，负责发起请求和管理会话。

### 2. MCP Client（客户端）
嵌入在 Host 内部的组件，负责与一个或多个 MCP Server 建立和维护连接。

### 3. MCP Server（服务器）
独立的轻量级服务，提供工具（Tools）、资源（Resources）和提示词（Prompts）三类能力。

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ MCP Host    │◄───────►│ MCP Client  │◄───────►│ MCP Server  │
│ (Claude)    │         │             │         │ (Git/Files) │
└─────────────┘         └─────────────┘         └─────────────┘
```

## 三大核心能力

### Tools（工具）
允许 AI 调用外部功能，如执行代码、操作文件系统、访问 API 等。服务器明确定义可用的工具及其参数，AI 可以动态发现和调用。

### Resources（资源）
提供结构化数据访问能力，如文件内容、数据库记录、API 响应等。AI 可以读取但不能修改资源内容。

### Prompts（提示词）
服务器可以提供预定义的提示词模板，帮助 AI 更好地完成特定任务，提高输出质量。

## 协议特性

### 安全优先设计
- 细粒度的访问控制
- 沙箱化的工具执行环境
- 显式的用户授权机制

### 可扩展性
- 支持多种编程语言 SDK（C#/Go/Java/Kotlin/PHP/Python/Ruby/Rust/Swift/TypeScript）
- 易于开发和部署新服务器
- 统一的发现和注册机制

### 标准化
- 明确的协议规范
- 互操作性强
- 丰富的官方和社区服务器生态

## 快速上手

### 安装官方 SDK

```bash
# TypeScript
npm install @modelcontextprotocol/sdk

# Python
pip install mcp

# Go
go get github.com/modelcontextprotocol/go-sdk
```

### 配置 Claude Desktop

在 `~/.config/claude-desktop/claude_desktop_config.json` 中添加服务器配置：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"],
      "env": {}
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## 应用场景

MCP 的典型应用场景包括：

1. **代码开发**：连接 Git、文件系统、代码仓库
2. **数据查询**：访问数据库、API、数据湖
3. **自动化操作**：执行系统命令、CI/CD 流程
4. **信息检索**：网络搜索、知识库查询
5. **第三方服务**：集成 SaaS 平台、企业应用

## 总结

Model Context Protocol 为 AI 应用提供了一个标准化、安全、可扩展的外部集成方案。随着 MCP 生态的持续壮大，我们有理由相信它将成为 AI 助手与现实世界交互的基础协议标准。

下一篇文章我们将详细介绍 MCP 官方服务器的实际应用案例。

::: info

参考资料：
- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [MCP GitHub 仓库](https://github.com/anthropics/mcp)
- [MCP Servers 官方示例](https://github.com/modelcontextprotocol/servers)

:::
