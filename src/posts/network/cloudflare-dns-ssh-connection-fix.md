---
title: Cloudflare DNS 导致 SSH 连接问题
date: 2026-02-27
tags:
  - Cloudflare
  - DNS
  - SSH
  - 代理
categories:
  - 网络技术
---

## 问题描述

将域名 DNS 交给 Cloudflare 后，使用原有域名进行 SSH 连接失败。

## 原因分析

Cloudflare 主要代理 HTTP/HTTPS 流量（80、443 端口），**不代理 SSH 流量**（22、2222 等端口）。

开启代理后（橙色云图标），域名会解析到 Cloudflare 的 IP，而非服务器真实 IP，导致 SSH 连接失败。

<!-- more -->

## 解决方案

### 方案一：SSH 用法（推荐）

1. 保持 `www` 域名的代理状态（网站需要保护）
2. 新建 SSH 专用子域名（如 `ssh.example.com`）
3. 该子域名设置为**仅 DNS**（灰色云），指向服务器真实 IP

```bash
ssh user@ssh.example.com -i ~/.ssh/id_ed25519 -p 2222
```

### 方案二：SSH 配置优化

在 `~/.ssh/config` 中添加：

```
Host alias
    HostName ssh.example.com
    User username
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
```

之后只需执行 `ssh alias`。

## 配置对照表

| 域名 | 用途 | 代理状态 |
|------|------|----------|
| `www.example.com` | 网站 | 橙色云（已代理） |
| `ssh.example.com` | SSH | 灰色云（仅 DNS） |

## 排查命令

```bash
dig www.example.com +short
nslookup www.example.com
```

若返回 Cloudflare IP（104.x.x.x、172.x.x.x 等），说明开启了代理。

## 要点总结

- 网站用 `www` + 代理，享受 Cloudflare 防护
- SSH 用独立子域名 + 仅 DNS，直连服务器 IP
- 两个子域名可指向同一 IP，区别在于代理状态
