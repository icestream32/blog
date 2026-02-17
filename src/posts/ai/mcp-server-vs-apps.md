---
title: 传统 MCP Server 与 MCP Apps 的核心区别
shortTitle: MCP Server vs MCP Apps
isOriginal: true
order: 3
cover: https://images.icestream32.cn/images/2025/02/17/mcp-server-vs-apps-cover.jpg
category:
    - 计算机
    - AI
tag:
    - MCP
    - Model Context Protocol
    - AI 应用
    - 交互界面
---

在使用 Model Context Protocol（MCP）的过程中，我们经常会听到两种类型的扩展：传统 MCP Server 和 MCP Apps。它们虽然同属 MCP 生态，但在交互方式和使用体验上有本质的区别。本文将通过具体案例，深入解析两者的核心差异。

<!-- more -->

## 传统 MCP Server 的工作方式

传统 MCP Server 是 MCP 生态中最基础也是最常见的组件。它让 AI 能够执行操作并获取结果，但所有交互都通过文本进行。

### 工作流程

```
用户 → AI → MCP Server 执行操作 → 返回文本/JSON → AI 解读 → 用户看到文字描述
```

### 真实示例：Playwright MCP

```typescript
// 工具定义
{
  name: "goto",
  description: "导航到指定 URL",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "目标页面 URL" }
    }
  }
}

// 返回结果
{
  content: [
    { "type": "text", "text": "已打开浏览器，导航到 https://example.com，页面加载完成，找到登录按钮。" }
  ]
}
```

### 特点总结

| 特性 | 说明 |
|------|------|
| **返回格式** | 纯文本或 JSON |
| **用户视角** | 通过 AI 描述了解发生了什么 |
| **交互方式** | 对话式，需要多次 prompt 调整 |
| **可视化** | 无，需要 AI 描述或额外截图 |

### 典型工具示例

```typescript
// 浏览器自动化
goto(url) → "页面已加载"
click(selector) → "已点击按钮"
get_text(selector) → "获取到文本: '提交'"

// 文件系统
read_file(path) → 返回文件内容文本
list_directory(path) → 返回文件列表文本

// Git 操作
git_log() → "提交历史：1. feat: 添加功能..."
git_diff() → "diff 结果：+ 新行 - 旧行"
```

---

## MCP Apps 的工作方式

MCP Apps 是 MCP 协议的官方扩展，让工具可以返回交互式 UI 组件，直接在对话中渲染。

### 工作流程

```
用户 → AI → MCP App 返回 UI 资源 → 宿主渲染 iframe → 用户直接交互
                                      ↑                    ↓
                                AI 实时感知操作 ←──── postMessage
```

### 核心机制

```typescript
// 工具定义（带 UI 元数据）
{
  name: "visualize_sales",
  description: "将销售数据可视化为交互式仪表板",
  inputSchema: {
    type: "object",
    properties: {
      dateRange: { type: "string" },
      metrics: { type: "array" }
    }
  },
  _meta: {
    ui: {
      resourceUri: "ui://charts/sales-dashboard"
    }
  }
}
```

### 返回结果

```json
{
  "content": [
    { "type": "text", "text": "以下是上月销售数据概览：" }
  ],
  "_meta": {
    "ui": {
      "type": "dashboard",
      "resourceUri": "ui://charts/sales-dashboard"
    }
  }
}
```

宿主（Claude、ChatGPT 等）收到后，会在沙盒化 iframe 中渲染交互式仪表板，用户可以直接操作。

### 特点总结

| 特性 | 说明 |
|------|------|
| **返回格式** | UI 组件（iframe） |
| **用户视角** | 直接看到并操作可视化界面 |
| **交互方式** | 点击、拖拽、筛选等原生 UI 操作 |
| **双向通信** | 通过 postMessage 实现实时交互 |

---

## 场景对比

### 场景一：查看销售数据

**传统 MCP Server**：

```json
{
  "total_sales": 125000,
  "by_region": [
    {"region": "华北", "sales": 45000},
    {"region": "华东", "sales": 38000},
    {"region": "华南", "sales": 42000}
  ]
}
```

用户看到的是一串 JSON，要继续探索必须说：
- "按月份展示趋势"
- "筛选出北京地区"
- "显示占比饼图"

**MCP Apps**：

返回交互式仪表板，用户可以直接：
- 点击筛选器实时更新
- 拖拽时间轴调整范围
- 点击图表钻取详情
- 一键导出报表

### 场景二：配置部署

**传统 MCP Server**：

返回配置项列表文本，用户需要理解每个字段的含义。

**MCP Apps**：

返回表单组件，支持：
- 依赖字段动态显示/隐藏
- 实时输入验证
- 即时预览效果

### 场景三：查看文档

**传统 MCP Server**：

返回文本片段或需要 AI 描述内容。

**MCP Apps**：

返回内嵌 PDF 视图，支持：
- 高亮关键条款
- 点击跳转章节
- 直接标记审批

### 场景四：监控系统

**传统 MCP Server**：

返回指标数值快照，需要重新查询才能更新。

**MCP Apps**：

返回实时仪表板，自动刷新，展示：
- 实时指标变化
- 告警阈值可视化
- 历史趋势对比

---

## 核心区别总结

| 维度 | 传统 MCP Server | MCP Apps |
|------|----------------|----------|
| **本质** | AI 的"手"和"脚" | AI 的"屏幕"和"鼠标" |
| **输出** | 纯文本/JSON | 交互式 UI 组件 |
| **用户感知** | 通过 AI 描述了解结果 | 直接看到并操作界面 |
| **交互模式** | 对话式（多次 prompt） | 直接操作 UI |
| **实时性** | 每次都是静态快照 | UI 可实时更新 |
| **适用场景** | 命令执行、API 调用 | 数据可视化、表单、仪表板 |

---

## 用 Web 测试场景理解

假设你需要生成自动化测试报告：

### Playwright MCP（传统）

```
AI → 执行测试 → 返回:
"测试通过，发现 3 个警告：
1. WARNING: 元素定位器 timeout
2. WARNING: 截图大小异常
3. WARNING: API 响应时间超过 2s"
```

你看到的是文字描述，如果想看细节，需要继续问：
- "第一个警告的具体位置？"
- "失败的截图在哪里？"
- "导出完整报告"

### MCP Apps 版本（假想的测试报告 App）

```
AI → 执行测试 → 返回: ui://test-report-dashboard
```

你直接看到可视化测试报告界面：
- 📊 测试概览卡片（通过率、耗时）
- 🔴 失败用例列表（可点击展开详情）
- ⚠️ 警告过滤和搜索
- 📁 一键导出 PDF/HTML 报告

---

## 一句话总结

> **传统 MCP 告诉 AI "发生了什么"，MCP Apps 让用户"亲眼看到并操作"。**

- 传统 MCP 是 **"AI 的工作报告"** —— AI 执行操作，返回文字描述
- MCP Apps 是 **"AI 的共享屏幕"** —— AI 返回 UI，用户直接交互

两者相辅相成：传统 MCP 让 AI 能够执行操作，MCP Apps 让结果变得更加直观和可操作。

---

## 技术通信机制对比

| 方面 | 传统 MCP | MCP Apps |
|------|---------|----------|
| **工具定义** | `name`, `description`, `inputSchema` | 额外包含 `_meta.ui.resourceUri` |
| **返回值** | `content: [{type: "text", text: "..."}]` | 包含 UI 资源引用，宿主渲染 iframe |
| **交互流程** | 单向：工具 → 返回结果 | 双向：UI ↔ AI 通过 postMessage 通信 |
| **数据更新** | 每次调用都是新的快照 | UI 可保持状态并实时更新 |

---

## 如何选择？

**选择传统 MCP Server 当：**
- 需要执行具体操作（点击、输入、API 调用）
- 返回结果简单明确
- 不需要可视化展示

**选择 MCP Apps 当：**
- 需要展示复杂数据（图表、仪表板）
- 用户需要直接交互（筛选、排序、导出）
- 需要实时更新的界面

---

::: info

相关阅读：
- [MCP Apps 正式发布：交互式 AI 应用的新时代](./mcp-apps-official)
- [掌握 MCP 工具开发：五个核心设计原则](./mcp-tool-development-guide)

参考资料：
- [MCP Apps 官方原文](https://modelcontextprotocol.info/zh-cn/blog/mcp-apps-ui-capabilities/)
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [ext-apps SDK](https://github.com/modelcontextprotocol/ext-apps)

:::
