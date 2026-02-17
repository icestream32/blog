---
title: OpenClaw 工作区 Skills 加载问题排查指南
isOriginal: true
order: 17
category:
    - 计算机
tag:
    - openclaw
    - skills
    - debug
---

在使用 OpenClaw 时，有时会遇到工作区 Skills 不显示或加载不全的问题。本文将详细介绍这类问题的排查思路和解决方案，帮助你快速恢复 Skills 的正常使用。

<!-- more -->

## 问题现象

* 在 OpenClaw 面板中只显示部分 Skills
* 新添加的 Skills 没有出现在列表中
* Skills 列表与预期不符

## 排查思路

### 第一步：确认 Skills 目录结构

首先检查工作区中的 Skills 目录：

```bash
ls -la skills/
```

确保你的 Skills 都放在 `workspace/skills/` 目录下，且每个 Skill 包含正确的 `SKILL.md` 文件。

### 第二步：检查 Skills Snapshot 缓存

OpenClaw 在首次创建 session 时会生成 Skills 快照，并缓存到：

```
~/.openclaw/agents/blog/sessions/sessions.json
```

该快照包含已识别的 Skills 列表，后续不会重新扫描目录。如果快照内容过期，可能导致 Skills 列表不完整。

**解决方案**：删除快照缓存，让 OpenClaw 重新扫描：

```bash
rm -rf ~/.openclaw/agents/blog/sessions/sessions.json
```

删除后，向 blog agent 发送一条新消息，OpenClaw 会重新扫描并更新快照。

### 第三步：检查 Bash 配置

OpenClaw 命令行工具依赖于正确的 Bash 配置。如果 `openclaw` 命令找不到，可能是因为：

* 新开的终端没有加载 `.bashrc`
* NVM 环境未初始化

**解决方案**：创建 `~/.bash_profile` 确保 `.bashrc` 被加载：

```bash
# ~/.bash_profile
[ -f ~/.bashrc ] && . ~/.bashrc
```

这样无论是交互式登录shell还是非登录shell，都会正确加载配置。

### 第四步：验证面板刷新

在 OpenClaw 面板中尝试以下操作：

1. 点击 **Reload Config** 重新加载配置
2. 点击 **Refresh** 刷新页面
3. 重启 OpenClaw Gateway

```bash
openclaw gateway restart
```

## 常见问题与解决方案

### 问题一：Skills 数量不完整

**现象**：工作区有 4 个 Skills，但面板只显示 1 个。

**原因**：Skills Snapshot 缓存了首次识别时的状态。

**解决**：
```bash
rm -rf ~/.openclaw/agents/blog/sessions/sessions.json
# 然后向 blog agent 发送新消息触发重新扫描
```

### 问题二：openclaw 命令不存在

**现象**：新开终端后 `openclaw` 命令提示未找到。

**原因**：终端没有正确加载 NVM 和 OpenClaw 配置。

**解决**：
```bash
# 创建或编辑 ~/.bash_profile
echo '[ -f ~/.bashrc ] && . ~/.bashrc' >> ~/.bash_profile
source ~/.bash_profile
```

### 问题三：.cursor/skills 目录干扰

**现象**：同时存在 `.cursor/skills` 和 `skills/` 目录，OpenClaw 可能只读取其中一个。

**解决**：
```bash
# 删除 .cursor/skills 软链接或目录
rm -rf .cursor/skills
# 确保工作区根目录有 skills/ 目录
```

### 问题四：Skills 未正确配置

**现象**：某个 Skill 始终不显示。

**原因**：SKILL.md 文件格式不正确或缺少必要字段。

**检查**：
```bash
# 确保 SKILL.md 包含以下 frontmatter
cat skills/your-skill/SKILL.md | head -10
```

正确的格式：
```yaml
---
name: skill-name
description: 技能描述
---
```

## 调试技巧

### 1. 查看当前加载的 Skills

向 blog agent 发送消息询问：

```
你现在有哪些 workspace skills？
```

### 2. 检查 Gateway 状态

```bash
openclaw gateway status
```

### 3. 查看 Gateway 日志

```bash
openclaw gateway logs
```

### 4. 手动触发重新扫描

删除缓存后，发起任何消息都会触发重新扫描。

## 预防措施

### 1. 统一 Skills 目录

始终将所有 Skills 放在 `workspace/skills/` 目录下，避免分散放置。

### 2. 及时更新文档

添加新 Skill 后，更新 AGENTS.md 中的说明：

```markdown
## Every Session

...

5. **Check `skills/`** — 列出当前有哪些 skills（如 `ls skills/`）
```

### 3. 定期清理缓存

如果经常添加 Skills，可以定期清理缓存：

```bash
rm -rf ~/.openclaw/agents/blog/sessions/sessions.json
```

### 4. 使用正确的命令路径

确保在 `.bash_profile` 中加载 NVM：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

## 总结

OpenClaw Skills 加载问题通常由以下原因导致：

| 问题原因 | 解决方案 |
|---------|---------|
| Skills Snapshot 缓存过期 | 删除 `~/.openclaw/agents/blog/sessions/sessions.json` |
| Bash 配置未加载 | 创建 `~/.bash_profile` 加载 `.bashrc` |
| .cursor/skills 干扰 | 删除 `.cursor/skills` 目录 |
| 面板缓存 | 点击 Reload Config / Refresh |
| Gateway 状态异常 | 重启 Gateway (`openclaw gateway restart`) |

遵循以上排查步骤，可以快速定位并解决大部分 Skills 加载问题。

::: info

* [OpenClaw 官方文档](https://docs.openclaw.ai)
* [OpenClaw GitHub](https://github.com/openclaw/openclaw)

:::
