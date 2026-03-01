---
title: OpenClaw + OfoxAI 记忆配置与实测全流程
isOriginal: true
order: 18
category:
    - 计算机
    - OpenClaw
tag:
    - OpenClaw
    - OfoxAI
    - Memory
    - Embedding
    - 排错
---

这篇文章记录了我把 OpenClaw 记忆能力接到 OfoxAI 的完整过程：先对齐官方文档，再用编程方式直连 API 验证，最后做 CLI 回归测试，确保 main、blog、psy-mate 三个 agent 都能稳定检索。

<!-- more -->

## 一、先对齐 Ofox 文档规则

我先确认了三份文档：模型列表、embeddings 接口和 OpenClaw 集成文档。核心结论有三点：

1. 模型 ID 要写完整的 `provider/model-name`。
2. embeddings 端点是 `POST /v1/embeddings`。
3. `openai/text-embedding-3-small` 与 `openai/text-embedding-3-large` 都可用。

这个前置校验非常关键。后面出现的 404，本质上都和模型名是否带 `openai/` 前缀有关。

## 二、先做 API 直连，再改 OpenClaw

我没有直接改配置，而是先做两类请求验证：

- `GET /v1/models`：确认模型确实存在。
- `POST /v1/embeddings`：对比带前缀与不带前缀的返回。

实测结果很明确：

| 模型名 | 结果 | 说明 |
|---|---|---|
| `openai/text-embedding-3-small` | 200 | 维度 1536 |
| `text-embedding-3-small` | 404 | `model_not_found` |
| `openai/text-embedding-3-large` | 200 | 维度 3072 |
| `text-embedding-3-large` | 404 | `model_not_found` |

结论：在 OfoxAI 里，embedding 模型名必须带 provider 前缀。

## 三、OpenClaw 记忆配置的关键点

为了让多 agent 稳定可用，我在 `~/.openclaw/openclaw.json` 里统一配置了：

- `compaction.memoryFlush`
- `memorySearch`
- `plugins.slots.memory`

实际联调里最容易踩坑的是：

- 当 `memorySearch.provider = "openai"` 时，某些链路会把 `openai/` 前缀裁掉。
- 裁掉后远端收到 `text-embedding-3-small`，在 OfoxAI 会直接 404。

我最终采用的可行方案是：

- `provider` 设为 `mistral`（保证模型名原样透传）
- `model` 仍写 `openai/text-embedding-3-small`
- `remote.baseUrl` 指向 `https://api.ofox.ai/v1`

这样能稳定保留前缀，embeddings 请求正常返回。

## 四、三 agent 继承检查

我确认了当前配置继承关系：

- `memorySearch` 和 `compaction` 定义在 `agents.defaults`
- `main / blog / psy-mate` 没有单独覆盖这些字段

因此三者会继承同一套 memory 配置。后续测试也验证了这一点。

## 五、CLI 回归测试

我执行了下面这组命令：

```bash
openclaw memory status --json
openclaw memory index --force
openclaw memory search --agent main --query "session start" --max-results 3 --json
openclaw memory search --agent blog --query "PR" --max-results 3 --json
openclaw memory search --agent psy-mate --query "session" --max-results 3 --json
```

结果：

- 三个 agent 的 `memory index --force` 都是 `updated`
- 维度统一为 1536
- `memory search` 都有稳定命中

说明链路从建索引到查询已经全部打通。

## 六、排错清单

如果你也遇到 `model_not_found`，我建议按这个顺序排：

1. `openclaw memory status --json` 看 provider/model。
2. 直连 `GET /v1/models` 核对模型名。
3. 直连 `/v1/embeddings` 对比带前缀与不带前缀。
4. 检查中间层是否裁剪模型名前缀。
5. 重新 `openclaw memory index --force`，再跑 `memory search`。

## 总结

这次联调的最大经验是：embedding 链路问题先用 API 直连把边界验证清楚，再回到 OpenClaw 做配置调整。只要确保模型名透传，三 agent 的记忆能力就能稳定工作。

::: info
参考资料：
- [Ofox Models](https://docs.ofox.ai/develop/models)
- [Ofox Embeddings](https://docs.ofox.ai/api/openai/embeddings)
- [Ofox x OpenClaw](https://docs.ofox.ai/develop/integrations/openclaw)
:::
