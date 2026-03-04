---
title: 用 Cloudflare Zero Trust 保护暴露在公网的 OpenClaw 实例
isOriginal: true
order: 6
category:
    - 计算机
    - 网络
tag:
    - Cloudflare
    - Zero Trust
    - 网络安全
    - 内网穿透
    - frp
---

最近发现安全社区在讨论 OpenClaw 实例公网暴露的问题，我自己也是通过 frps 穿透 + Cloudflare 代理域名的方式在用，整理了一下风险分析和迁移到 Zero Trust 的完整过程。

<!-- more -->

## 一、为什么单纯穿透 + Cloudflare 代理不够安全

最开始的架构是这样的：

```
公网 → Cloudflare（仅代理） → frps → OpenClaw 控制面板
```

看起来有 Cloudflare 挡在前面，实际上 Cloudflare 默认只是把流量转发过来，不做任何身份验证。只要知道域名，任何人都能访问到 OpenClaw 的控制界面。

几个具体风险点：

- **被扫描器快速发现**：Shodan 等工具会持续扫描，OpenClaw 实例的特征很明显
- **暴力破解**：没有访问频率限制，密码爆破成本极低
- **RCE 风险**：OpenClaw 具备动作执行能力，一旦被控制不只是单点入侵
- **Cloudflare ≠ 安全屏障**：它只负责流量转发和 DNS，不会修补应用层漏洞

## 二、Zero Trust 方案：Cloudflare Tunnel + Access

迁移后的架构：

```
公网用户
  ↓
Cloudflare Edge（WAF 过滤）
  ↓
Cloudflare Access（强制身份验证）
  ↓
Cloudflare Tunnel（出站连接，无需开放公网端口）
  ↓
localhost:18789（OpenClaw 实例）
```

核心变化是两点：一是 frps 换成 Cloudflare Tunnel，不再暴露任何公网端口；二是 Cloudflare Access 在请求到达服务之前强制身份验证。

## 三、配置步骤

### 安装 cloudflared

```bash
# 直接下载二进制（不依赖包管理器，最稳）
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
cloudflared --version
```

### 登录并创建 Tunnel

```bash
# 授权 cloudflared 访问账号（会打开浏览器）
cloudflared tunnel login

# 创建 Tunnel，生成 credentials JSON
cloudflared tunnel create openclaw
```

创建后会在 `~/.cloudflared/` 下生成 `<TUNNEL_ID>.json`，这是 Tunnel 的运行凭据。

### 编写配置文件

```yaml
# /etc/cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: openclaw.example.com
    service: http://localhost:18789
  - service: http_status:404
```

### 注册为系统服务

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

验证状态：

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

日志里出现 `Registered tunnel connection` 说明连接成功。

### 配置 Access 身份验证

在 Cloudflare Zero Trust 控制台的 **Access → Applications** 里：

1. 添加应用，类型选 **Self-hosted**
2. 域名填写 `openclaw.example.com`
3. 创建访问策略，接入 Google 或 GitHub 身份提供商
4. 在 **Integrations → Identity providers** 配置 OAuth Client ID/Secret

配置完成后，访问域名会先跳到 Cloudflare Access 登录页，验证通过才能进入 OpenClaw 控制面板。

## 四、关于 Cloudflare Free 计划

Zero Trust 免费版足够个人使用：

| 特性 | Free 计划 |
|------|-----------|
| Zero Trust Access | ✅ 可用 |
| Cloudflare Tunnel | ✅ 可用 |
| 用户座位上限 | 50 个 |
| 日志保留 | 较短（约 24h） |
| WAF 基础规则 | ✅ 可用 |

超过 50 个内网用户或需要长期日志保留才需要升级付费计划。

## 总结

从裸穿透迁移到 Cloudflare Zero Trust 之后，外网扫描器看不到任何开放端口，未经身份验证的请求在 Cloudflare 边缘就被拦截了。核心就是两点：**用 Tunnel 替代端口转发**，**用 Access 强制身份验证**。配置不复杂，Free 计划完全够用。

::: info

参考资料：
- [Cloudflare Zero Trust Access 文档](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/)
- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)

:::
