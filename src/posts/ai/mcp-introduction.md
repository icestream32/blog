---
title: 初识 Model Context Protocol (MCP)
shortTitle: 初识 MCP
isOriginal: true
order: 1
category:
    - 计算机
    - AI
tag:
    - MCP
    - Model Context Protocol
    - Claude
    - AI 应用
    - LLM
    - Anthropic
---

Model Context Protocol（MCP）是由 Anthropic 于 2024 年 11 月发布的开源协议，为 LLM 与外部数据源、工具之间建立标准化、安全的通信桥梁。可以把它理解为 **AI 应用的 USB-C 端口**——正如 USB-C 为电子设备提供统一的连接标准，MCP 为 AI 应用连接外部系统提供了标准化的方式。本文将带你从零开始认识 MCP 协议、核心架构、官方服务器，以及工具开发的设计原则。

<!-- more -->

## 一、为什么需要 MCP？

在 MCP 出现之前，AI 助手与外部世界的集成面临诸多挑战：

- **碎片化集成**：每个 AI 应用都需要为不同的数据源单独开发适配器，开发成本高、维护困难
- **安全风险**：AI 可能意外暴露敏感数据或执行危险操作，缺乏统一的权限边界
- **缺乏标准化**：开发者难以复用已有的集成方案，生态割裂
- **扩展困难**：添加新功能需要修改核心代码，无法做到即插即用

MCP 提供了一套**统一的协议标准**，让 AI 能够安全、可控地访问外部工具和数据源。无论你是开发者、AI 应用方还是最终用户，都能从中受益：

- **开发者**：减少开发时间和复杂度，一次开发可在多个 AI 应用中复用
- **AI 应用**：接入丰富的生态，增强能力、提升用户体验
- **最终用户**：获得更强大的 AI 助手，能访问你的数据并在必要时代为执行操作

## 二、MCP 能实现什么？

MCP 开启了丰富的应用场景想象空间：

- **个性化助手**：AI 可访问你的 Google Calendar 和 Notion，成为真正懂你的助手
- **代码生成**：Claude Code 可根据 Figma 设计稿生成完整的 Web 应用
- **企业数据分析**：企业聊天机器人连接多个数据库，用户通过对话即可分析数据
- **创意工作流**：AI 在 Blender 中创建 3D 设计，并驱动 3D 打印机输出

## 三、核心架构

MCP 采用客户端-服务器架构，包含三个核心组件：

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ MCP Host    │◄───────►│ MCP Client  │◄───────►│ MCP Server  │
│ (Claude)    │         │             │         │ (Git/Files) │
└─────────────┘         └─────────────┘         └─────────────┘
```

- **MCP Host**：运行 AI 助手的应用（Claude Desktop、Cursor IDE、ChatGPT 等）
- **MCP Client**：嵌入 Host 内部，负责与 MCP Server 建立连接、收发消息
- **MCP Server**：独立轻量级服务，提供 Tools、Resources、Prompts 三类能力

每个 Server 是独立的进程，通过 stdio 或 HTTP 与 Client 通信，互不干扰。这种设计让 AI 应用可以灵活组合多个数据源和工具。

## 四、三大核心能力

MCP Server 向 AI 暴露三类能力：

| 能力 | 说明 | 典型场景 |
|------|------|----------|
| **Tools（工具）** | AI 可调用的外部功能 | 执行代码、操作文件、访问 API、发送邮件 |
| **Resources（资源）** | 结构化数据访问，AI 可读取但不能修改 | 配置文件、数据库只读视图、文档 |
| **Prompts（提示词）** | 预定义提示词模板 | 代码审查模板、写作风格模板、多轮对话模板 |

Tools 是 AI 的「手」和「脚」，Resources 是 AI 的「眼睛」，Prompts 则帮助 AI 以更高质量完成任务。

## 五、快速上手

### 安装 SDK

```bash
# TypeScript/JavaScript
npm install @modelcontextprotocol/sdk

# Python
pip install mcp
```

### 配置 Claude Desktop

在 `~/.config/claude-desktop/claude_desktop_config.json`（macOS）或对应路径添加：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>" }
    }
  }
}
```

重启 Claude Desktop 后，AI 即可使用文件系统和 Git 能力。

## 六、官方服务器实战

MCP 官方仓库 [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) 提供了多个参考实现：

### Filesystem Server

- **能力**：读写文件、创建/删除目录、文件搜索
- **场景**：代码分析、配置管理、日志查看

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    }
  }
}
```

### Git Server

- **能力**：提交历史、文件版本、分支管理、diff 查看
- **场景**：代码审查、版本查询、提交信息生成

```bash
uvx mcp-server-git
# 或 pip install mcp-server-git && mcp_server_git
```

### Fetch Server

- **能力**：HTTP GET、HTML 转 Markdown、内容摘要
- **场景**：在线文档、API 文档、技术博客抓取

### Memory Server

- **能力**：实体存储、关系图谱、长期记忆
- **场景**：用户偏好、项目上下文、对话历史持久化

### 第三方生态

[MCP Registry](https://registry.modelcontextprotocol.io/) 提供丰富的第三方服务器：数据库（PostgreSQL、MongoDB）、云服务（AWS、GitHub）、开发工具（Docker、Jira）等。开发者可以按需选用，无需重复造轮子。

## 七、开发自定义服务器

以下是一个最简的 TypeScript MCP Server 示例：

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-custom-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "hello",
    description: "一个简单的问候工具，用于测试 MCP 连接",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "要问候的人名" }
      },
      required: ["name"]
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "hello") {
    const name = request.params.arguments?.name ?? "世界";
    return {
      content: [{ type: "text", text: `你好，${name}！` }]
    };
  }
  throw new Error(`未知工具: ${request.params.name}`);
});

server.connect(new StdioServerTransport());
```

保存为 `server.ts`，运行 `npx tsx server.ts` 即可启动。更多细节可参考 [MCP 官方开发文档](https://modelcontextprotocol.io/docs/develop/build-server)。

## 八、MCP 工具开发五大原则

**核心理念**：工具是给 AI 用的，不是给人用的。从 AI 的认知特性出发——AI 擅长推理但不擅长猜测，需要清晰、结构化的输入输出。

### 原则一：选择正确的抽象层次

提供高层抽象工具，一次性完成完整操作，而非让 AI 编排多个底层调用。

```typescript
// ❌ 反模式：让 AI 自己编排
list_users() + list_events(user_id) + create_event(...)

// ✅ 正模式：一个工具完成完整流程
schedule_event({ participants, topic, duration, timezone })
```

### 原则二：智能命名空间

使用 `<服务名>_<动词>_<对象>` 格式，避免命名冲突，让 AI 一眼能理解工具用途。

```typescript
// ✅ 清晰明确
asana_search_projects(team_id)
jira_create_issue(project_key, fields)

// ❌ 含糊不清
search()  // 搜索什么？
```

### 原则三：返回有意义的上下文

返回 AI 友好的结构化数据，移除技术细节（如 UUID、内部 URL）。

```json
// ✅ 语义清晰
{ "name": "张三", "role": "管理员", "status": "在线" }

// ❌ 技术细节过多
{ "user_uuid": "a1b2c3d4-...", "avatar_256px_url": "...", "mime_type": "image/png" }
```

### 原则四：Token 效率优化

支持 `brief`/`detailed`/`full` 等模式，按需获取数据，避免一次性返回海量内容。

### 原则五：精确的工具描述

描述需包含：用途、自动完成的操作、限制、参数格式、使用示例。AI 依赖描述决定何时调用工具、如何传参。

## 九、最佳实践与安全

- **权限控制**：只暴露必要文件或目录，敏感数据用只读模式
- **密钥管理**：使用环境变量传递 API Token，不要硬编码
- **依赖更新**：定期更新 MCP SDK 和依赖，修复安全漏洞
- **性能考虑**：限制单次返回量、合理使用缓存、设置超时
- **错误处理**：完善恢复机制、返回清晰错误信息、关键操作记录日志

## 总结

MCP 为 AI 应用提供了标准化、安全、可扩展的外部集成方案。从协议基础到官方服务器，从自定义开发到工具设计原则，掌握这些内容即可开始构建或使用 MCP 生态。若想进一步了解 MCP 如何突破纯文本限制、带来交互式 UI 能力，可阅读 [MCP Apps 详解](/posts/ai/mcp-apps-deep-dive.html)。

::: info

参考资料：
- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [MCP Servers 官方仓库](https://github.com/modelcontextprotocol/servers)
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [MCP 工具开发原文](https://modelcontextprotocol.info/zh-cn/blog/writing-effective-mcp-tools/)

:::
