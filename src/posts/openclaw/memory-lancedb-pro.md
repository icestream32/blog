---
title: OpenClaw 记忆系统升级：memory-lancedb-pro 安装与配置
isOriginal: true
order: 11
category:
    - 计算机
    - AI
tag:
    - OpenClaw
    - LanceDB
    - 向量检索
    - 记忆系统
    - AI Agent
---

记录将 OpenClaw 内置的文件存储记忆替换为支持混合检索的 LanceDB Pro 插件的全过程，包括安装步骤、配置详解和多 Agent 记忆空间隔离方案。

<!-- more -->

## 一、为什么要换记忆插件

OpenClaw 默认使用 `memory-core`，本质是基于文件的存储，检索能力有限。`memory-lancedb-pro` 是社区开发的增强版插件，在向量搜索的基础上叠加了 BM25 全文检索、跨编码器重排序、时效性加成等一系列高级特性。

两者的核心差异对比：

| 功能 | memory-core | memory-lancedb-pro |
|------|:-----------:|:------------------:|
| 向量搜索 | ✅ | ✅ |
| BM25 全文检索 | ❌ | ✅ |
| 混合融合（Vector + BM25） | ❌ | ✅ |
| 时效性加成 / 时间衰减 | ❌ | ✅ |
| MMR 多样性去重 | ❌ | ✅ |
| 多 Scope 隔离 | ❌ | ✅ |
| 噪声过滤 | ❌ | ✅ |
| 自适应检索 | ❌ | ✅ |
| 管理 CLI | ❌ | ✅ |
| 任意 OpenAI 兼容 Embedding | 有限 | ✅ |

## 二、安装步骤

### 2.1 Clone 插件到 workspace

插件需要放在 OpenClaw workspace 目录下，推荐绝对路径以避免路径解析歧义：

```bash
cd ~/.openclaw/workspace
git clone https://github.com/win4r/memory-lancedb-pro.git plugins/memory-lancedb-pro
cd plugins/memory-lancedb-pro
npm install
```

### 2.2 配置 openclaw.json

在 `~/.openclaw/openclaw.json` 的 `plugins` 段添加配置：

```json
{
  "plugins": {
    "allow": ["memory-lancedb-pro", "telegram", "whatsapp"],
    "load": {
      "paths": ["/home/icestream32/.openclaw/workspace/plugins/memory-lancedb-pro"]
    },
    "slots": {
      "memory": "memory-lancedb-pro"
    },
    "entries": {
      "memory-core": { "enabled": false },
      "memory-lancedb-pro": {
        "enabled": true,
        "config": {
          "embedding": {
            "apiKey": "<YOUR_API_KEY>",
            "model": "text-embedding-3-small",
            "baseURL": "https://api.ofox.ai/v1",
            "dimensions": 1536
          },
          "dbPath": "~/.openclaw/memory/lancedb-pro",
          "autoCapture": true,
          "autoRecall": false,
          "retrieval": {
            "mode": "hybrid",
            "vectorWeight": 0.7,
            "bm25Weight": 0.3,
            "minScore": 0.3,
            "rerank": "none",
            "filterNoise": true,
            "hardMinScore": 0.35
          },
          "scopes": {
            "default": "global",
            "definitions": {
              "global": { "description": "共享知识库" },
              "agent:main": { "description": "主 Agent 私有记忆" },
              "agent:agent1": { "description": "Agent1 私有记忆" },
              "agent:agent2": { "description": "Agent2 私有记忆" }
            },
            "agentAccess": {
              "main": ["agent:main"],
              "agent1": ["agent:agent1"],
              "agent2": ["agent:agent2"]
            }
          }
        }
      }
    }
  }
}
```

### 2.3 验证配置并重启网关

```bash
openclaw config validate
openclaw gateway restart
```

## 三、关键配置说明

### 3.1 Embedding 模型

本次使用的是 OpenAI 兼容的 `text-embedding-3-small`（1536 维），通过第三方中转接口调用。插件支持任意 OpenAI 兼容的 Embedding 提供商：

| 提供商 | 模型 | 维度 |
|--------|------|------|
| OpenAI / 兼容接口 | text-embedding-3-small | 1536 |
| Jina | jina-embeddings-v5-text-small | 1024 |
| Google Gemini | gemini-embedding-001 | 3072 |
| Ollama（本地） | nomic-embed-text | 自定义 |

### 3.2 混合检索策略

检索管线按以下顺序执行：

```
Query → 向量搜索 ─┐
                   ├→ RRF 融合 → 时效加成 → 重要性加权 → 噪声过滤 → 返回
Query → BM25 FTS ─┘
```

- **向量权重** 0.7，**BM25 权重** 0.3
- **硬最低分** 0.35，低于阈值直接丢弃
- **时效加成**：新记忆得分更高（默认半衰期 14 天）
- **MMR 去重**：余弦相似度 > 0.85 的结果自动降级

### 3.3 autoRecall 为何关闭

启用 `autoRecall` 后，插件会在每次对话前自动注入相关记忆到上下文。但实测模型有时会把 `<relevant-memories>` 块原样输出到回复里，造成信息泄漏。关闭后由 Agent 主动调用 `memory_recall` 工具按需检索，更可控。

### 3.4 多 Agent Scope 隔离

三个 Agent 各有独立的记忆空间，互不干扰：

| Agent | Scope | 说明 |
|-------|-------|------|
| main | `agent:main` | 主对话 Agent |
| agent1 | `agent:agent1` | Agent1 |
| agent2 | `agent:agent2` | Agent2 |

`global` scope 保留但当前未分配给任何 Agent，未来可用于跨 Agent 共享知识。

## 四、验证安装

```bash
# 确认插件已加载
openclaw plugins list

# 确认 memory slot 指向新插件
openclaw config get plugins.slots.memory
# 期望输出：memory-lancedb-pro

# 运行诊断
openclaw plugins doctor

# 查看插件详情
openclaw plugins info memory-lancedb-pro
```

成功后输出示例：

```
memory-lancedb-pro@1.0.30: plugin registered
  db: /home/icestream32/.openclaw/memory/lancedb-pro
  model: text-embedding-3-small
Status: loaded
Tools: memory_recall, memory_store, memory_forget, memory_update
```

## 五、插件提供的工具

| 工具 | 用途 |
|------|------|
| `memory_recall` | 混合检索相关记忆 |
| `memory_store` | 存储新记忆（含自动分类） |
| `memory_forget` | 删除特定记忆 |
| `memory_update` | 更新已有记忆 |

管理 CLI：`openclaw memory-pro`，支持 list / search / stats / delete / export / import 等操作。

## 总结

`memory-lancedb-pro` 相比内置的 `memory-core` 在检索质量上有质的提升，特别是中文场景下 BM25 的关键词精确匹配能有效弥补纯向量检索的语义漂移问题。配合多 Scope 隔离，每个 Agent 的记忆完全独立，不会互相污染。整个安装过程约 10 分钟，主要时间花在 npm 依赖安装上。

::: info

参考资料：
- [memory-lancedb-pro GitHub](https://github.com/win4r/memory-lancedb-pro)

:::
