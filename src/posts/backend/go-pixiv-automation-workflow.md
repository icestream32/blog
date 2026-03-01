---
title: 用 Go 打造 Pixiv 插画自动化工作流
shortTitle: Pixiv 自动化工作流
isOriginal: true
order: 5
category:
    - 计算机
    - 后端开发
tag:
    - Go
    - Pixiv
    - Chevereto
    - CLI
    - 自动化
---

这篇文章记录了我从零搭建 Pixiv 插画自动化流水线的完整实践：用 Go CLI 串起「Pixiv 抓取 → 人工审批 → Chevereto 上传 → 博客链接导出」，把重复劳动压到最低。

<!-- more -->

## 一、为什么要做这套流程

以前我整理 Pixiv 素材是纯手工：下载、筛选、上传图床、复制链接，再写博客。图片一多就非常耗时。

所以我的目标很明确：

1. 机械步骤交给程序。
2. 审美判断保留人工。
3. 最终产出直接可用于博客。

完整流程如下：

```text
Pixiv 抓取关注画师作品 -> 本地下载 -> 生成人工审批清单
-> 人工 approve/reject -> 批量上传 Chevereto -> 导出博客链接 JSON
```

## 二、技术选型

| 组件 | 选择 | 主要原因 |
|---|---|---|
| 语言 | Go | 单二进制部署方便，并发模型适合 I/O 任务 |
| CLI | Cobra + Viper | 命令树清晰，配置层次完整 |
| 登录 | chromedp | Pixiv 2FA 需要真实浏览器走 PKCE |
| 日志 | logrus | stderr 日志 / stdout 结果，便于脚本拼接 |

## 三、Pixiv 登录：PKCE 是核心

Pixiv 这块最麻烦的是认证。简单账号密码 API 基本不可用，特别是开了 2FA 后。

我最终方案是浏览器 PKCE：

1. 生成 `code_verifier` 和 `code_challenge`
2. 打开登录页让用户手动登录
3. 监听回调 URL 抓 `authorization code`
4. 用 `code + verifier` 交换 token

这个方案虽然复杂，但兼容性最好，也最接近官方 App 行为。

## 四、Pixiv API 实战坑点

有两个细节最关键：

- 请求头要伪装移动客户端（含 `User-Agent` 和签名头）。
- 下载原图时必须带 `Referer: https://www.pixiv.net/`，否则 CDN 会 403。

另外，插画返回结构单图和多图不一致，我做了归一化逻辑，统一抽取可下载 URL。

## 五、人工审批设计：让机器等人

我没有做全自动筛图，而是引入了 `decisions.json`：

1. 程序先生成待审核列表（默认全拒绝）。
2. 我手动把想要的图片改成 `approve: true`。
3. 程序再按决策分拆 approved/rejected。

匹配策略是双通道：优先按 `illust_id`，回退按文件路径，尽量避免误匹配。

## 六、Chevereto 上传细节

Chevereto 是另一个坑点，核心经验：

- API Key 要放在 multipart 表单字段里，不是 Header。
- v4 要求 `chv_` 前缀 key。
- 大图上传超时要调大（我用 120 秒）。
- 响应 JSON 在不同版本结构不同，要做多路径兜底解析。

## 七、命令行用法

完整使用流程：

```bash
./pixiv-auto-fetch auth browser-login
./pixiv-auto-fetch fetch followed --limit 20
./pixiv-auto-fetch review bundle
# 手动编辑 decisions.json，把目标图片改为 approve: true
./pixiv-auto-fetch review apply
./pixiv-auto-fetch upload metadata \
  --metadata-file ./workspace/review/approved.json \
  --output-file ./workspace/review/upload-report.json
./pixiv-auto-fetch review export-links
```

## 总结

这套流程的价值不在于“全自动”，而在于把高重复、低价值的步骤彻底标准化，把真正需要判断的环节保留给人。对我来说，这已经足够稳定，能长期复用。

::: info
参考资料：
- [pixiv-crawl 源码](https://github.com/icestream32/pixiv-crawl)
:::
