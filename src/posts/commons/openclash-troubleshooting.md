---
title: OpenWrt 软路由 OpenClash 启动失败故障排查与模式切换
isOriginal: true
cover: https://images.icestream32.cn/images/2025/12/27/heita.jpg
category:
    - 计算机
    - 网络
tag:
    - OpenWrt
    - OpenClash
    - 软路由
    - 故障排查
---

<!-- more -->

## 问题描述

在 OpenWrt 软路由上使用 OpenClash 时，遇到 TUN 接口启动失败的问题。日志显示：

```
2025-12-09 13:58:17 警告：TUN 接口启动失败，尝试重启内核...
2025-12-09 13:56:09 警告：检测到您启用了 IPv6 的 DHCP 服务，可能会造成连接异常！
```

**解决方案**：由于需要 IPv6 支持，最终采用 **Redir 模式**替代 TUN 模式，并启用 IPv6 DHCP 服务。

<!-- more -->

## 问题分析

### 1. 主要问题

通过排查发现两个主要问题：

#### 问题一：配置文件不完整

- **现象**：`/etc/openclash/config.yaml` 文件内容不完整，只有一行 `mixed-port: 7890`
- **原因**：配置文件损坏或未正确生成
- **影响**：导致 Clash 核心无法读取完整的配置，TUN 接口无法启动

#### 问题二：IPv6 DHCP 服务冲突

- **现象**：日志提示 IPv6 DHCP 服务可能造成连接异常
- **原因**：LAN 接口启用了 IPv6 DHCP 服务器（`dhcpv6: server`），与 OpenClash 的 TUN 模式冲突
- **影响**：可能导致网络连接异常，影响 TUN 接口的正常工作
- **解决方案**：切换到 Redir 模式，Redir 模式与 IPv6 DHCP 服务兼容

### 2. 排查过程

#### 检查 OpenClash 状态

```bash
# 检查进程状态
ps | grep clash | grep -v grep

# 检查 TUN 接口
ip tuntap show

# 查看日志
tail -100 /tmp/openclash.log
```

#### 检查配置文件

```bash
# 检查配置文件大小和内容
ls -la /etc/openclash/config.yaml
cat /etc/openclash/config.yaml | head -20

# 检查完整配置文件位置
ls -la /etc/openclash/config/config.yaml
```

#### 检查网络配置

```bash
# 检查 IPv6 DHCP 配置
cat /etc/config/dhcp | grep -A 5 'config dhcp.*lan'

# 检查 IPv6 相关进程
ps | grep -E 'odhcpd|dhcpv6' | grep -v grep
```

## 解决方案

### 方案一：切换到 Redir 模式（推荐，支持 IPv6）

如果需要 IPv6 支持，建议切换到 Redir 模式，该模式与 IPv6 DHCP 服务兼容。

#### 步骤一：切换运行模式

通过 UCI 命令切换模式：

```bash
uci set openclash.config.en_mode='redir-host'
uci commit openclash
```

或者通过 LuCI 界面：

1. 登录 OpenWrt Web 管理界面
2. 进入 **服务** → **OpenClash** → **运行模式设置**
3. 将 **运行模式** 设置为 **Redir-Host**
4. 保存配置

#### 步骤二：修复配置文件

1. **备份配置文件**

```bash
cp /etc/openclash/config/config.yaml /etc/openclash/config/config.yaml.bak
```

2. **复制完整配置文件**

```bash
cp /etc/openclash/config/config.yaml /etc/openclash/config.yaml
```

3. **移除 TUN 配置**（Redir 模式不需要 TUN）

```bash
sed -i '/^tun:/,/^[a-z]/ { /^[a-z]/!d; }' /etc/openclash/config/config.yaml
sed -i '/^tun:/d' /etc/openclash/config/config.yaml
```

4. **启用 IPv6 支持**

```bash
sed -i 's/^ipv6: false/ipv6: true/' /etc/openclash/config/config.yaml
```

配置文件示例：

```yaml
port: 7890
socks-port: 7891
redir-port: 7892
mixed-port: 7893
allow-lan: false
unified-delay: true
mode: rule
log-level: info
ipv6: true
external-controller: 0.0.0.0:9090
clash-for-android:
  append-system-dns: false
profile:
  tracing: true
experimental:
  sniff-tls-sni: true
```

#### 步骤三：启用 IPv6 DHCP 服务

通过 UCI 命令启用 LAN 接口的 IPv6 DHCP 服务：

```bash
uci set dhcp.lan.dhcpv6='server'
uci commit dhcp
/etc/init.d/dnsmasq restart
```

通过 UCI 启用 OpenClash 的 IPv6 支持：

```bash
uci set openclash.config.ipv6_enable='1'
uci commit openclash
```

或者通过 LuCI 界面操作：

1. 登录 OpenWrt Web 管理界面
2. 进入 **网络** → **接口** → **LAN** → **DHCP 服务器**
3. 在 **IPv6 设置** 中，将 **DHCPv6 服务** 设置为 **服务器模式**
4. 进入 **服务** → **OpenClash** → **运行模式设置**
5. 启用 **IPv6 支持**
6. 保存并应用配置

#### 步骤四：重启 OpenClash

```bash
/etc/init.d/openclash restart
```

### 方案二：修复 TUN 模式（不支持 IPv6）

如果不需要 IPv6，可以继续使用 TUN 模式。

#### 步骤一：修复配置文件

1. **备份配置文件**

```bash
cp /etc/openclash/config/config.yaml /etc/openclash/config/config.yaml.bak
```

2. **复制完整配置文件**

```bash
cp /etc/openclash/config/config.yaml /etc/openclash/config.yaml
```

3. **添加 TUN 配置**

在配置文件的 `experimental:` 部分后添加 TUN 配置：

```yaml
tun:
  enable: true
  stack: system
  dns-hijack:
    - any:53
  auto-route: true
  auto-detect-interface: true
```

#### 步骤二：禁用 IPv6 DHCP 服务

通过 UCI 命令禁用 LAN 接口的 IPv6 DHCP 服务：

```bash
uci set dhcp.lan.dhcpv6='disabled'
uci commit dhcp
/etc/init.d/dnsmasq restart
```

#### 步骤三：重启 OpenClash

```bash
/etc/init.d/openclash restart
```

或者通过 LuCI 界面：

1. 进入 **服务** → **OpenClash**
2. 点击 **停止**，然后点击 **启动**

## 验证解决方案

### 1. 检查 OpenClash 进程

```bash
ps | grep clash | grep -v grep
```

应该看到类似输出：

```
17751 root     1369m S    /etc/openclash/clash -d /etc/openclash -f /etc/openclash/config.yaml
17752 root      1472 S    {openclash_watch} /bin/sh /usr/share/openclash/openclash_watchdog.sh
```

### 2. 检查运行模式（Redir 模式）

```bash
uci show openclash.config | grep en_mode
```

应该看到：

```
openclash.config.en_mode='redir-host'
```

**注意**：Redir 模式不需要 TUN 接口，所以 `ip tuntap show` 应该为空。

如果使用 TUN 模式，检查 TUN 接口：

```bash
ip tuntap show
ip addr show | grep utun
```

应该看到：

```
utun: tun
576: utun: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 9000 qdisc fq_codel state UNKNOWN group default qlen 500
    inet 198.18.0.1/30 brd 198.18.0.3 scope global utun
```

### 3. 检查日志

```bash
tail -30 /tmp/openclash.log
```

日志应该显示正常的流量代理信息，没有 TUN 接口启动失败的警告。

### 4. 检查 IPv6 配置（Redir 模式）

```bash
# 检查 IPv6 DHCP 服务状态
uci show dhcp.lan | grep dhcpv6
ps | grep odhcpd | grep -v grep

# 检查 IPv6 地址
ip -6 addr show | grep -E 'inet6.*global'
```

应该看到：

```
dhcp.lan.dhcpv6='server'
25437 root      1276 S    /usr/sbin/odhcpd
    inet6 240e:3b6:d052:21f0::1/60 scope global dynamic noprefixroute
```

### 5. 测试网络连接

```bash
# 测试 DNS 解析
nslookup www.google.com

# 测试代理连接
curl -I https://www.google.com

# 测试 IPv6 连接（Redir 模式）
curl -6 -I https://www.google.com
```

## 配置说明

### 运行模式对比

| 特性 | TUN 模式 | Redir 模式 |
|------|---------|-----------|
| IPv6 支持 | ❌ 与 IPv6 DHCP 冲突 | ✅ 完全支持 |
| 性能 | 较高 | 较高 |
| 配置复杂度 | 较高 | 较低 |
| DNS 处理 | 自动劫持 | 需要配置 |
| 适用场景 | 不需要 IPv6 | 需要 IPv6 |

### TUN 配置参数说明（仅 TUN 模式）

- `enable: true`：启用 TUN 模式
- `stack: system`：使用系统网络栈
- `dns-hijack`：DNS 劫持配置，拦截所有 DNS 请求到端口 53
- `auto-route: true`：自动配置路由规则
- `auto-detect-interface: true`：自动检测网络接口

### Redir 模式配置说明

- `en_mode: redir-host`：使用 Redir-Host 模式
- `ipv6: true`：启用 IPv6 支持
- `redir-port: 7892`：Redir 端口（用于流量转发）
- 不需要 TUN 配置，使用 iptables 进行流量转发

### IPv6 DHCP 配置说明

- **TUN 模式**：建议禁用 IPv6 DHCP 服务，避免与 TUN 接口的路由规则冲突
- **Redir 模式**：可以启用 IPv6 DHCP 服务，两者兼容良好

## 常见问题

### Q1: 修改配置后仍然无法启动？

**A:** 检查以下几点：

1. 确认配置文件格式正确（YAML 语法）
2. 检查 Clash 核心文件权限：`ls -la /etc/openclash/core/clash_meta`
3. 检查内核是否支持 TUN：`lsmod | grep tun`
4. 查看详细错误日志：`tail -100 /tmp/openclash.log`

### Q2: 需要 IPv6 支持怎么办？

**A:** 推荐切换到 Redir 模式：

1. 切换到 Redir 模式：`uci set openclash.config.en_mode='redir-host'`
2. 启用 IPv6：`uci set openclash.config.ipv6_enable='1'`
3. 启用 IPv6 DHCP：`uci set dhcp.lan.dhcpv6='server'`
4. 在配置文件中设置 `ipv6: true`
5. 重启 OpenClash 服务

Redir 模式完全支持 IPv6，且与 IPv6 DHCP 服务兼容。

### Q3: TUN 接口创建成功，但流量不走代理？

**A:** 检查以下几点：

1. 确认路由规则正确：`ip route show`
2. 检查防火墙规则：`iptables -t nat -L -n`
3. 确认代理规则配置正确
4. 检查 DNS 配置是否正确

## 总结

本次故障的根本原因是：

1. **配置文件不完整**：`/etc/openclash/config.yaml` 文件损坏，只有一行配置
2. **IPv6 DHCP 冲突**：LAN 接口的 IPv6 DHCP 服务与 TUN 模式冲突

### 最终解决方案

由于需要 IPv6 支持，采用 **Redir 模式**：

1. ✅ 切换运行模式为 `redir-host`
2. ✅ 修复配置文件，移除 TUN 配置
3. ✅ 启用 IPv6 支持（`ipv6: true`）
4. ✅ 启用 IPv6 DHCP 服务
5. ✅ 重启 OpenClash 服务

修复后，OpenClash 在 Redir 模式下正常运行，支持 IPv6，流量代理功能正常工作。

### 验证结果

- ✅ OpenClash 进程正常运行
- ✅ 运行模式：`redir-host`
- ✅ IPv6 已启用：`ipv6: true`
- ✅ IPv6 DHCP 服务运行中：`odhcpd` 进程正常
- ✅ IPv6 地址已分配：`240e:3b6:d052:21f0::1/60`
- ✅ 流量代理正常：日志显示正常代理流量

## 参考信息

- **OpenClash 版本**：最新版本
- **Clash 核心**：Mihomo Meta (Clash Meta)
- **OpenWrt 版本**：6.6.73
- **运行模式**：redir-host（支持 IPv6）
- **IPv6 支持**：已启用
- **IPv6 DHCP**：已启用（服务器模式）

---

::: tip
如果遇到类似问题，建议按照本文档的排查步骤逐一检查，大部分问题都能通过检查配置文件和网络设置来解决。
:::

::: info
封面来源：[X](https://x.com/nez_39/status/1879453461827527069)
:::

