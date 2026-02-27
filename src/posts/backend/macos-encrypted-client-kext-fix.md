---
title: macOS 加密客户端内核扩展问题修复
date: 2026-02-27
tags:
  - macOS
  - 加密客户端
  - 内核扩展
  - 问题修复
categories:
  - 后端技术
---

## 问题描述

macOS 系统更新后，TEC Guangzhou 加密客户端提示"内核加载异常"，无法正常使用。

## 原因分析

macOS 对系统扩展有严格的权限限制。系统更新后，内核扩展（kext）可能未正确加载，导致加密客户端无法工作。

<!-- more -->

## 解决步骤

### 1. 确认内核扩展路径

```bash
ls /usr/local/.OCular/ko/
```

根据芯片类型选择对应的内核扩展：
- Apple Silicon: `LSDEfs2600_arm.kext`
- Intel: 对应的 x86 版本

### 2. 手动加载内核扩展

```bash
sudo kextutil -c /usr/local/.OCular/ko/LSDEfs2600_arm.kext
```

执行后系统会触发安全提示。

### 3. 在系统设置中允许

1. 打开 **系统设置 → 隐私与安全性**
2. 出现"允许"按钮后点击允许
3. 按提示重启系统

## 补充方案

### 检查登录项与扩展

在较新的 macOS 中，可通过 **系统设置 → 通用 → 登录项与扩展** 查看并启用相关扩展。

### 确认是否为残留软件

```bash
ps aux | grep LAgent
cd /usr/local/.OCular
ls
```

## 要点总结

- `kextutil` 手动加载可触发 macOS 的"允许系统扩展"提示
- 首次可能需要管理员密码授权
- 若以后系统更新后再次出现问题，重复上述步骤即可
