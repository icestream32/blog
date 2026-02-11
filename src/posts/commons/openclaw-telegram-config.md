---
title: OpenClaw Telegram 配置
isOriginal: true
order: 11
category:
    - 计算机
    - OpenClaw
tag:
    - OpenClaw
    - Telegram
    - 配置
    - Bindings
---

通过配置 OpenClaw 的 Telegram 绑定，可以将 Telegram 聊天机器人连接到特定的 agent，实现自动化的聊天交互。

<!-- more -->

## 配置方法

### 1. 添加 Bot Token

首先需要从 Telegram 获取 Bot Token：

```bash
https://api.telegram.org/bot<TOKEN>/getUpdates
```

访问上述链接获取你的 bot 的 chat_id 和配置信息。

### 2. 配置 Bindings

在 `~/.openclaw/openclaw.json` 中添加 bindings 配置：

```json
{
  "match": {
    "channel": "telegram"
  },
  "agentId": "blog"
}
```

这个配置将 Telegram 通道的聊天绑定到 blog agent。

### 3. 读取私聊配置

私聊的 chat_id 从以下文件读取：

```bash
~/.openclaw/credentials/telegram-allowFrom.json
```

## Gateway 管理命令

配置完成后，需要重启 gateway 使配置生效：

```bash
# 查看运行状态
openclaw gateway status

# 启动 gateway
openclaw gateway start

# 停止 gateway
openclaw gateway stop

# 重启 gateway
openclaw gateway restart
```

## 实际应用

配置完成后，你可以通过 Telegram 与 OpenClaw 的 blog agent 交互，自动生成和管理博客文章。

::: info

**延伸阅读：**

- [VuePress 官方文档](https://vuepress.vuejs.org/)
- [Git 官方文档](https://git-scm.com/doc)
- [OpenClaw 官方文档](/openclaw-docs)
- [Markdown Guide](https://www.markdownguide.org/)

:::
