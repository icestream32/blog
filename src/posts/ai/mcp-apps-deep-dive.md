---
title: MCP Apps 实战 - 官方服务器应用详解
shortTitle: MCP 官方服务器实战
isOriginal: true
order: 2
cover: https://images.icestream32.cn/images/2025/02/17/mcp-apps-cover.jpg
category:
    - 计算机
    - AI
tag:
    - MCP
    - Model Context Protocol
    - Claude
    - AI 应用
---

上一篇文章我们介绍了 MCP 协议的核心概念与架构设计。本文将深入探索 MCP 官方维护的服务器实现，通过实际案例展示如何利用这些服务器构建强大的 AI 应用。

<!-- more -->

## 官方服务器概览

MCP 官方仓库（[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)）提供了多个参考实现服务器，涵盖文件系统、Git 操作、Web 抓取、内存管理等功能。这些服务器不仅可以直接使用，更是学习 MCP 开发的最佳范本。

## 参考服务器详解

### 1. Filesystem Server

安全文件系统访问是 MCP 最基础也最实用的功能之一。

**核心能力**：
- 读取/写入文件
- 创建/删除目录
- 列出目录内容
- 文件搜索

**配置示例**：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/directory"
      ]
    }
  }
}
```

**应用场景**：
- 代码文件读取与分析
- 配置文件管理
- 日志文件查看
- 项目结构探索

### 2. Git Server

将 Git 操作能力集成到 AI 助手中，大幅提升代码开发效率。

**核心能力**：
- 查看提交历史
- 读取文件历史版本
- 创建/切换分支
- 查看差异（diff）
- 管理暂存区

**配置示例**：

```bash
# 使用 uvx 运行
uvx mcp-server-git

# 或使用 pip 安装
pip install mcp-server-git
mcp_server_git
```

**配置认证**：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

**应用场景**：
- 代码审查辅助
- 版本历史查询
- 分支管理
- 提交信息生成

### 3. Fetch Server

高效获取和处理网页内容，为 AI 提供实时信息访问能力。

**核心能力**：
- HTTP GET 请求
- HTML 到 Markdown 转换
- 内容摘要生成
- 编码处理

**配置示例**：

```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**应用场景**：
- 在线文档获取
- API 文档查询
- 新闻资讯采集
- 技术博客内容抓取

### 4. Memory Server

基于知识图谱的持久化内存系统，让 AI 记住跨会话的重要信息。

**核心能力**：
- 实体存储与关联
- 关系图谱管理
- 长期记忆保持
- 上下文恢复

**配置示例**：

```bash
npx -y @modelcontextprotocol/server-memory
```

**应用场景**：
- 用户偏好记忆
- 项目上下文保持
- 学习成果积累
- 对话历史持久化

### 5. Sequential Thinking Server

动态推理服务器，支持分步思考和问题分解。

**核心能力**：
- 思维链管理
- 递归问题解决
- 反思性分析
- 推理路径追踪

**应用场景**：
- 复杂问题分解
- 决策辅助分析
- 代码逻辑梳理
- 创意方案构思

### 6. Time Server

时区转换和时间处理工具。

**核心能力**：
- 时区转换
- 时间格式解析
- 时间计算
- 日历查询

**应用场景**：
- 跨时区协作
- 时间数据处理
- 日程安排

## 快速开始

### 1. 环境准备

```bash
# 安装 uv（Python 包管理器，推荐）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 或安装 Node.js
# https://nodejs.org/
```

### 2. 安装并配置服务器

以 Git 服务器为例：

```bash
# 安装
uvx mcp-server-git

# 配置环境变量
export GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
```

### 3. 集成到 Claude Desktop

编辑配置文件：

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/your/project/path"]
    }
  }
}
```

### 4. 重启应用并测试

重启 Claude Desktop 后，可以通过自然语言使用这些能力：

- "查看这个项目的提交历史"
- "读取 src/main.py 文件"
- "创建新功能分支"

## 第三方服务器生态

除了官方服务器，MCP 社区还提供了大量第三方实现：

### 数据库类
- PostgreSQL / MySQL / SQLite
- ClickHouse / Apache Doris
- MongoDB / Redis

### 云服务类
- AWS / Azure / GCP
- Cloudflare / GitHub
- Slack / Notion

### 开发工具类
- Chrome DevTools
- Docker / Kubernetes
- Jira / Confluence

### AI & 机器学习
- OpenAI / Anthropic
- Pinecone / Weaviate
- LangChain / LlamaIndex

完整列表可在 [MCP Registry](https://registry.modelcontextprotocol.io/) 查看。

## 开发自己的 MCP 服务器

使用 TypeScript SDK 创建简单服务器：

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-custom-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 列出可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello",
        description: "简单的问候工具",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "要问候的名字" }
          },
          required: ["name"]
        }
      }
    ]
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "hello") {
    const name = args?.name as string;
    return {
      content: [
        { type: "text", text: `你好，${name}！欢迎使用 MCP 服务器！` }
      ]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// 启动服务器
const transport = new StdioServerTransport();
server.connect(transport);
```

## 最佳实践

### 1. 权限控制
- 只暴露必要的文件和目录
- 使用只读模式访问敏感数据
- 定期审查服务器权限

### 2. 安全性
- 不要在代码中硬编码密钥
- 使用环境变量管理认证信息
- 定期更新服务器依赖

### 3. 性能优化
- 限制返回数据量
- 使用缓存减少重复请求
- 合理设置超时时间

### 4. 错误处理
- 实现完善的错误恢复机制
- 提供清晰的错误信息
- 记录关键操作日志

## 总结

MCP 官方服务器为开发者提供了开箱即用的能力，同时通过丰富的 SDK 支持自定义开发。随着 MCP 生态的持续扩展，AI 应用与外部世界的集成将变得更加简单和强大。

::: info

参考资料：
- [MCP Servers 官方仓库](https://github.com/modelcontextprotocol/servers)
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Python SDK](https://github.com/modelcontextprotocol/python-sdk)

:::
