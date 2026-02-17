---
title: MCP Apps 正式发布 - 交互式 AI 应用的新时代
shortTitle: MCP Apps 交互式 UI 组件
isOriginal: true
order: 1
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

2025 年初，Anthropic 正式发布了 MCP Apps，这是 Model Context Protocol 的第一个官方扩展，让工具可以返回交互式 UI 组件。本文将详细介绍 MCP Apps 的核心特性、技术原理和应用场景。

<!-- more -->

## 传统 MCP 工具的痛点

在 MCP Apps 出现之前，MCP 工具存在一个显著的局限性：**只能返回纯文本结果**。

当你使用 MCP 工具获取数据后，如果想要进行筛选、排序或深入探索，往往需要编写额外的 prompt 来调整请求：

- "只显示上周的数据"
- "按收入排序"
- "筛选出状态为活跃的用户"

这种交互方式效率低下，用户体验不佳。

## MCP Apps 的核心突破

MCP Apps 填补了这一空白，让工具可以直接在对话中渲染交互式 UI 组件。

### 核心亮点

- **交互式 UI 组件**：仪表板、表单、数据可视化等可直接在对话中渲染
- **实时交互**：用户可以直接在 UI 中进行筛选、排序、点击等操作
- **模型实时感知**：AI 能够看到用户的操作行为，继续提供智能响应

### 技术原理

1. **工具声明增强**：工具在定义时添加 `_meta.ui.resourceUri` 字段，指向 UI 资源

2. **沙盒化渲染**：宿主应用（如 Claude）在沙盒化 iframe 中渲染 UI 组件，确保安全性

3. **双向通信**：通过 `postMessage` API 实现 AI 与 UI 组件之间的实时通信

```
┌─────────────┐    _meta.ui.resourceUri    ┌─────────────┐
│ MCP Tool    │ ─────────────────────────► │ 沙盒 iframe │
│             │                            │ (UI 渲染)   │
└─────────────┘                           └─────────────┘
        ▲                                      │
        │         postMessage 双向通信          │
        └──────────────────────────────────────┘
```

## 支持的客户端

MCP Apps 目前支持以下客户端：

- **Claude**（Web 版和桌面版）
- **Goose**
- **VS Code Insiders**
- **ChatGPT**（本周开始支持）

## 典型应用场景

### 1. 数据探索仪表板

AI 助手查询数据后，可以返回交互式的数据仪表板，用户可以直接：

- 调整时间范围
- 切换可视化类型
- 点击数据点查看详情
- 导出数据子集

### 2. 配置向导表单

复杂的配置流程可以转化为分步表单：

- 实时验证输入
- 根据选择动态显示/隐藏字段
- 保存配置进度

### 3. PDF 文档审查

AI 阅读文档后可以返回高亮标注的 PDF 视图：

- 点击跳转到相关上下文
- 查看 AI 生成的关键摘要
- 直接提问特定段落

### 4. 实时监控系统

运维场景中可以返回实时更新的监控面板：

- 自动刷新数据
- 告警阈值可视化
- 一键执行修复操作

## 快速上手示例

### 声明支持 UI 的工具

```typescript
{
  name: "analytics_dashboard",
  description: "获取销售数据分析仪表板",
  inputSchema: {
    type: "object",
    properties: {
      dateRange: { type: "string", description: "日期范围" },
      metrics: { type: "array", description: "要展示的指标" }
    }
  },
  _meta: {
    ui: {
      resourceUri: "https://api.example.com/ui/analytics-dashboard"
    }
  }
}
```

### UI 组件响应

工具调用返回时包含 UI 资源引用：

```json
{
  "content": [
    { "type": "text", "text": "这是您的销售数据分析结果：" }
  ],
  "_meta": {
    "ui": {
      "type": "dashboard",
      "resourceUri": "https://api.example.com/ui/analytics-dashboard",
      "actions": ["filter", "sort", "export"]
    }
  }
}
```

## 安全机制

MCP Apps 在提供丰富交互能力的同时，保持了严格的安全标准：

- **沙箱隔离**：UI 组件在独立的安全上下文中运行
- **显式授权**：用户需要明确授权才能渲染外部 UI
- **内容审查**：所有 UI 资源经过安全扫描
- **数据泄露防护**：敏感数据不会通过 UI 通道泄露

## 与传统工具的对比

| 特性 | 传统 MCP 工具 | MCP Apps |
|------|--------------|----------|
| 输出格式 | 纯文本 | 交互式 UI + 文本 |
| 用户交互 | 需要额外 prompt | 直接在 UI 中操作 |
| 数据探索 | 多次请求调整 | 实时筛选和过滤 |
| 模型感知 | 仅初始请求结果 | 用户操作实时同步 |
| 适用场景 | 简单查询 | 复杂数据分析 |

## 未来展望

MCP Apps 的发布标志着 AI 应用交互方式的重要演进：

1. **更自然的交互**：从"对话式"向"对话 + 可视化"转变
2. **更高效的探索**：用户可以直接操作数据，而非描述需求
3. **更强大的分析**：AI 与人类协作完成复杂任务
4. **更丰富的生态**：更多支持交互式 UI 的工具即将涌现

## 总结

MCP Apps 为 Model Context Protocol 注入了交互式 UI 的能力，让 AI 助手能够以更直观、更高效的方式与用户协作。从数据探索到系统监控，从文档审查到配置管理，MCP Apps 正在重新定义 AI 应用的交互范式。

::: info

相关阅读：
- [掌握 MCP 工具开发：五个核心设计原则](./mcp-tool-development-guide)

参考资料：
- [MCP Apps 官方原文](https://modelcontextprotocol.info/zh-cn/blog/mcp-apps-ui-capabilities/)
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP Apps 发布公告](https://www.anthropic.com/blog)

:::
