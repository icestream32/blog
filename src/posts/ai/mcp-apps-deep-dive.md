---
title: MCP Apps 详解 - 为 AI 对话带来交互式 UI
shortTitle: MCP Apps 详解
isOriginal: true
order: 2
category:
    - 计算机
    - AI
tag:
    - MCP
    - MCP Apps
    - Claude
    - ChatGPT
    - AI 应用
    - 交互式界面
---

2026 年初，MCP Apps 作为首个官方 MCP 扩展正式发布。工具现在可以返回交互式 UI 组件，直接在对话中渲染：仪表板、表单、数据可视化、多步骤工作流等。本文将深入解析 MCP Apps 的设计动机、工作原理、开发方式与安全模型，帮助你理解并构建下一代 AI 交互体验。

<!-- more -->

## 一、传统 MCP Server 与 MCP Apps

### 传统 MCP Server

**工作流程**：用户 → AI → MCP Server 执行 → 返回文本/JSON → AI 解读 → 用户看到文字描述

| 特性 | 说明 |
|------|------|
| 返回格式 | 纯文本或 JSON |
| 用户视角 | 通过 AI 描述了解结果 |
| 交互方式 | 对话式，需多次 prompt 调整 |

传统 MCP 是 AI 的「手」和「脚」——能执行操作、获取数据，但用户只能通过 AI 的转述来理解结果。

### MCP Apps

**工作流程**：用户 → AI → MCP App 返回 UI 资源 → 宿主渲染 iframe → 用户直接交互 ↔ AI 实时感知

| 特性 | 说明 |
|------|------|
| 返回格式 | 交互式 UI 组件 |
| 用户视角 | 直接看到并操作界面 |
| 交互方式 | 点击、拖拽、筛选等原生 UI 操作 |

MCP Apps 是 AI 的「屏幕」和「鼠标」——用户不仅能「听到」AI 的描述，还能「亲眼看到」并「亲手操作」数据与界面。

> **传统 MCP 告诉 AI「发生了什么」，MCP Apps 让用户「亲眼看到并操作」。**

### 核心区别对比

| 维度 | 传统 MCP Server | MCP Apps |
|------|----------------|----------|
| 本质 | AI 的「手」和「脚」 | AI 的「屏幕」和「鼠标」 |
| 输出 | 纯文本/JSON | 交互式 UI 组件 |
| 适用场景 | 命令执行、API 调用、数据查询 | 数据可视化、表单、仪表板、文档审查 |

## 二、为什么需要 MCP Apps？

### 传统工具的痛点

MCP 工具此前**只能返回纯文本**。考虑一个查询数据库的工具：它返回数据行，可能有数百行。模型可以总结这些数据，但用户通常想要**探索**：按列排序、筛选到日期范围、点击查看特定记录。

使用文本响应，每次交互都需要另一个提示词：
- 「只显示上周的」
- 「按收入排序」
- 「第 47 行的详情是什么？」

这可以工作，但很慢，体验割裂。

### 上下文差距

MCP 非常适合将模型连接到数据并赋予它们采取行动的能力。但**工具能做的事情**和**用户能看到的事情**之间仍然存在上下文差距。MCP Apps 弥补了这一差距：

- **模型保持在循环中**：看到用户的操作并相应响应
- **UI 处理文本无法做到的事**：实时更新、原生媒体查看器、持久状态、直接操作
- **熟悉的界面**：在一个界面中为模型和用户提供所需的所有上下文

## 三、什么是 MCP Apps？

MCP Apps 让工具能够返回**富交互式界面**，而不仅仅是纯文本。当工具声明一个 UI 资源时，宿主（Host）会在沙盒化的 iframe 中渲染它，用户可以直接在对话中与之交互。

### 典型场景

- **数据探索**：销售分析工具返回交互式仪表板。用户可以按地区筛选、深入查看特定账户、导出报表，无需离开对话。
- **配置向导**：部署工具呈现具有依赖字段的表单。选择「生产环境」会显示额外安全选项；选择「预发布环境」则显示不同默认值。
- **文档审查**：合同分析工具内联显示 PDF，高亮条款。用户点击批准或标记章节，模型实时看到他们的决策。
- **实时监控**：服务器健康工具显示实时指标，随系统变化而更新。无需重新运行工具即可查看当前状态。

这些交互如果用文本交流会很笨拙，而 MCP Apps 让它们变得自然——就像使用任何其他基于 Web 的 UI 应用一样。

## 四、工作原理

MCP Apps 的架构依赖于两个关键的 MCP 原语：

1. **带有 UI 元数据的工具**：工具包含 `_meta.ui.resourceUri` 字段，指向 UI 资源
2. **UI 资源**：通过 `ui://` scheme 提供的服务器端资源，包含打包的 HTML/JavaScript

### 声明支持 UI 的工具

```typescript
{
  name: "analytics_dashboard",
  description: "获取销售数据分析仪表板，支持按地区、时间筛选和导出",
  inputSchema: {
    type: "object",
    properties: {
      dateRange: { type: "string", description: "日期范围，如 2025-01-01~2025-01-31" }
    }
  },
  _meta: {
    ui: {
      resourceUri: "https://api.example.com/ui/analytics-dashboard"
      // 或使用 ui:// scheme: "ui://charts/interactive"
    }
  }
}
```

### 渲染与通信流程

1. 宿主获取 `resourceUri` 指向的 UI 资源（HTML/JS 包）
2. 在**沙盒化 iframe** 中渲染
3. 通过 `postMessage` 上的 JSON-RPC 实现**双向通信**：
   - UI → 宿主：更新模型上下文、调用服务器工具
   - 宿主 → UI：传递工具执行结果、用户操作事件

## 五、App API 开发

要构建新的 MCP Apps，可使用 [`@modelcontextprotocol/ext-apps`](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps) 包，它提供用于 UI 与宿主通信的 `App` 类：

```javascript
import { App } from "@modelcontextprotocol/ext-apps";

const app = new App();
await app.connect();

// 从宿主接收工具结果，用于渲染
app.ontoolresult = (result) => {
  renderChart(result.data);
};

// 从 UI 调用服务器工具（如获取详情）
const response = await app.callServerTool({
  name: "fetch_details",
  arguments: { id: "123" },
});

// 更新模型上下文，让 AI 感知用户操作
await app.updateModelContext({
  content: [{ type: "text", text: "用户选择了选项 B" }],
});
```

因为应用运行在客户端内部，它们可以做普通 iframe 做不到的事情：

- 记录事件用于调试
- 在用户浏览器中打开链接
- 发送后续消息推动对话前进
- 悄悄更新模型上下文供后续使用

所有这些都通过标准的 `postMessage` 进行，不会被锁定在任何框架中。

## 六、安全模型

从 MCP 服务器运行 UI 意味着在 MCP 宿主中运行**您没有编写的代码**。MCP Apps 通过多层机制处理这一问题：

| 机制 | 说明 |
|------|------|
| **Iframe 沙盒** | 所有 UI 内容在具有受限权限的沙盒化 iframe 中运行 |
| **预声明模板** | 宿主可以在渲染前审查 HTML 内容 |
| **可审计消息** | 所有 UI 到宿主的通信都通过可记录的 JSON-RPC |
| **用户同意** | 宿主可以要求对 UI 发起的工具调用进行明确批准 |

如果某些内容看起来可疑，宿主可以在渲染之前阻止它。用户在连接之前应继续主动、彻底地审查 MCP 服务器。

## 七、客户端支持

MCP Apps 目前已在以下客户端支持：

- **Claude**：Web 和桌面版现已可用
- **Goose**：Block 的 AI 助手，[现已可用](https://block.github.io/goose/docs/tutorials/building-mcp-apps/)
- **Visual Studio Code**：在 [VS Code Insiders](https://code.visualstudio.com/insiders) 中可用
- **ChatGPT**：已开始支持

这是第一次，MCP 工具开发者可以发布一个交互式体验，在广泛采用的各种客户端上工作，**无需编写一行客户端特定代码**。

## 八、快速开始

[ext-apps 仓库](https://github.com/modelcontextprotocol/ext-apps) 包含 SDK 和可工作的示例：

| 示例 | 说明 |
|------|------|
| `threejs-server` | 3D 可视化 |
| `map-server` | 交互式地图 |
| `pdf-server` | 文档查看 |
| `system-monitor-server` | 实时仪表板 |
| `sheet-music-server` | 乐谱展示 |

选择一个接近你正在构建的示例，从那里开始即可。

## 九、与 MCP-UI 的关系

[MCP-UI](https://mcpui.dev/) 和 [OpenAI Apps SDK](https://developers.openai.com/apps-sdk/) 开创了 MCP Apps 现在标准化的模式。这些项目证明 UI 资源可以且确实自然地适合 MCP 生态系统。

- **MCP-UI 不会消失**：SDK 支持 MCP Apps 模式，客户端 SDK 是寻求采用 MCP Apps 的宿主的推荐框架
- **迁移简单**：如果你已在用 MCP-UI，可继续使用；准备好时，迁移到官方扩展很简单

## 总结

MCP Apps 将 MCP 从「纯文本工具」升级为「交互式体验」，让用户能在对话中直接操作数据、表单和可视化界面，同时 AI 保持对用户行为的实时感知。理解其设计动机、工作原理与安全模型，有助于你构建更自然、更高效的 AI 应用。若尚未了解 MCP 协议基础，可先阅读 [初识 MCP](/posts/ai/mcp-introduction.html)。

::: info

参考资料：
- [MCP Apps 官方原文](https://modelcontextprotocol.info/zh-cn/blog/mcp-apps-ui-capabilities/)
- [MCP Apps 指南](https://modelcontextprotocol.io/docs/extensions/apps)
- [MCP Apps 入门](https://modelcontextprotocol.github.io/ext-apps/api/documents/Quickstart.html)
- [ext-apps 仓库](https://github.com/modelcontextprotocol/ext-apps)
- [@modelcontextprotocol/ext-apps](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)

:::
