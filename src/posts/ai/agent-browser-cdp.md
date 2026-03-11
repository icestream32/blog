---
title: agent-browser CDP 模式与登录态管理
isOriginal: true
category:
    - 计算机
    - AI 工具
tag:
    - AI Agent
    - Playwright
    - 浏览器自动化
    - CDP
---

记录在 macOS 下使用 agent-browser 遇到的 Chrome Local Network Access 权限弹窗问题，以及通过 CDP 模式连接现有 Chrome 浏览器实现登录态持久化的解决方案。

<!-- more -->

## 一、问题背景

在使用 agent-browser 进行浏览器自动化时，遇到了两个问题：

1. **Local Network Access 权限弹窗**：访问内网地址时，Chrome 会弹出权限确认窗口
2. **登录态丢失**：每次启动都创建新的 session，导致需要重复登录

这个弹窗的特点是：

- 不在页面 DOM 里
- Playwright / agent-browser 无法通过 `page.click()` 点击
- 默认自动化环境会被当成 Deny

所以页面就卡在这里了。

## 二、问题原因

### Chrome 的 Private Network Access (PNA) 策略

Chrome 引入了 Private Network Access 安全策略：当网页尝试访问本地网络资源（192.168.x.x、10.x、localhost 等）时，浏览器会要求用户授权。

这是为了防止攻击者通过网页攻击用户的路由器、NAS、IoT 设备。

### macOS 的系统级权限控制

macOS 从较新版本开始增加了 Local Network privacy permission。当应用（包括 Chrome）访问局域网设备时，系统会要求用户授权。

Windows 没有这一层系统权限机制，所以通常不会弹窗。

### agent-browser 的 session 隔离

agent-browser 默认每次启动新的 browser context，导致：

- cookies 丢失
- localStorage 丢失
- 权限数据库为空

于是每次都会弹权限窗口。

## 三、解决方案

### 方案一：CDP 模式连接现有 Chrome（推荐）

核心思路是让 Chrome 开启 remote debugging，然后 agent-browser 用 CDP（Chrome DevTools Protocol）连接。

**步骤 1：启动 Chrome（开启 CDP）**

macOS：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=~/agent-browser-profile \
  --disable-features=LocalNetworkAccessChecks
```

参数说明：

| 参数 | 作用 |
|------|------|
| `--remote-debugging-port=9222` | 开启 CDP 端口 |
| `--user-data-dir` | 指定独立 profile，避免污染日常浏览器 |
| `--disable-features=LocalNetworkAccessChecks` | 关闭 Local Network Access 检查 |

**步骤 2：用 agent-browser 连接**

```bash
agent-browser --cdp 9222 open https://example.com
```

这会连接现有 Chrome，不会启动新的浏览器。

### 方案二：Playwright 启动参数

如果直接使用 Playwright，可以在启动时传递 Chromium flags：

```typescript
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: false,
  args: [
    "--disable-features=LocalNetworkAccessChecks",
    "--disable-web-security",
    "--disable-site-isolation-trials"
  ]
});
```

更稳定的写法是使用 persistent context：

```typescript
const context = await chromium.launchPersistentContext(
  "./pw-profile",
  {
    headless: false,
    args: [
      "--disable-features=LocalNetworkAccessChecks"
    ]
  }
);
```

这样 cookies、permissions、localStorage 都会保存。

### 方案三：调用系统 Chrome

Playwright 支持调用本机 Chrome：

```typescript
chromium.launch({
  channel: "chrome",
  args: [
    "--disable-features=LocalNetworkAccessChecks"
  ]
});
```

优点：

- flags 生效
- 和系统 Chrome 行为一致

## 四、macOS 最佳实践

### 创建启动脚本

```bash
nano ~/start-agent-chrome.sh
```

写入：

```bash
#!/bin/bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.chrome-agent-profile \
  --disable-features=LocalNetworkAccessChecks \
  --disable-web-security \
  --no-first-run
```

赋权：

```bash
chmod +x ~/start-agent-chrome.sh
```

以后只需要运行 `~/start-agent-chrome.sh` 即可。

### 验证 CDP 是否开启

浏览器打开：

```
http://localhost:9222/json/version
```

如果看到 JSON 响应，说明 CDP 成功。

## 五、推荐架构

做 AI browser agent 时，最稳定的架构是：

```
Chrome (persistent profile)
    │
    ├── remote-debugging-port=9222
    │
    └── --disable-features=LocalNetworkAccessChecks
    │
agent-browser --cdp
    │
AI Agent
```

优点：

- 不会新建 browser
- 不会丢登录
- 不会弹权限
- 多 agent 可共享

## 六、常见问题

### 为什么 Windows 不弹窗？

通常是以下情况之一：

1. Windows Chrome 版本较旧，PNA 默认没启用
2. Windows Chrome 已经授权过
3. Windows 没有 macOS 的 Local Network OS 权限层

### 为什么 Playwright Chromium 特别容易触发？

因为 Playwright 的 Chromium：

1. 每次新 profile
2. 无 chrome flags
3. 权限数据库为空

所以每次都会弹权限窗口。

### 可以用 chrome://flags 关闭吗？

在 chrome://flags/#local-network-access-check 设为 Disabled 可以关闭，但 Playwright 自带的 Chromium 是一个全新浏览器 profile，不会读取你 Chrome 的 flags 设置。

所以需要在 Playwright 启动浏览器时直接传 Chromium flag。

## 总结

解决 agent-browser 的权限弹窗和登录态问题，最稳定的方案是使用 CDP 模式连接已有 Chrome 浏览器，配合 `--disable-features=LocalNetworkAccessChecks` 启动参数。

这样既能保持登录态持久化，又能避免重复的权限弹窗，让 AI agent 的浏览器自动化更加稳定。

::: info

参考资料：

- [agent-browser GitHub](https://github.com/vercel-labs/agent-browser)
- [Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access)
- [Playwright Browsers](https://playwright.dev/docs/browsers)

:::
