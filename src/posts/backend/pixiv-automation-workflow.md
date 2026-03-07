---
title: 用 Go 打造 Pixiv 插画自动化工作流
shortTitle: Pixiv 自动化工作流
isOriginal: true
order: 6
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

现在这套工具还有一个明确边界：CLI 只提供原子能力，调度和编排交给 OpenClaw 或外部任务系统。这样每个命令都更容易测试，也更容易做失败重试。

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

从架构上看，我把流程拆成了几个非常明确的原子命令：

1. `fetch followed`：负责拉取插画元数据并下载原图。
2. `review bundle`：把元数据转换成可人工审核的清单。
3. `review apply`：把人工决策重新映射回元数据。
4. `upload metadata`：把已批准的文件上传到 Chevereto。
5. `review export-links`：把上传结果导出成博客可消费的链接文件。

这种拆法有个直接好处：哪一步失败，就只重跑哪一步，而不是把整条链路从头再跑一遍。

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

真正上线跑起来以后，我又踩到一个更现实的问题：4K 原图有些能到 20MB 左右。30 秒超时在网络稍慢时并不稳，尤其是下载原图时，单张失败如果直接中断整批任务，体验会很差。

另外，插画返回结构单图和多图不一致，我做了归一化逻辑，统一抽取可下载 URL。

后来我把这块补成了更稳的策略：

1. Pixiv 下载默认超时从 30 秒提高到 120 秒。
2. 下载请求加入有上限的重试和退避，优先兜底超时、429、5xx 这类临时错误。
3. 单张下载失败不再直接中断整批抓取，而是把失败信息写回元数据。

也就是说，抓取阶段现在支持"部分成功"。成功的图会继续进入后续链路，失败的图会留在元数据里，方便下次补抓或排查。

## 五、人工审批设计：让机器等人

我没有做全自动筛图，而是引入了 `decisions.json`：

1. 程序先生成待审核列表（默认全拒绝）。
2. 我手动把想要的图片改成 `approve: true`。
3. 程序再按决策分拆 approved/rejected。

匹配策略是双通道：优先按 `illust_id`，回退按文件路径，尽量避免误匹配。

这里还有一个细节改动很关键：如果某张图在下载阶段已经失败，生成的 review bundle 会明确标记它是 `download_failed`，并保留错误信息，而不是伪装成普通待审核项。这样人工看到清单时，能直接区分"没审"与"没下成功"。

## 六、Chevereto 上传细节

Chevereto 是另一个坑点，核心经验：

- API Key 要放在 multipart 表单字段里，不是 Header。
- v4 要求 `chv_` 前缀 key。
- 大图上传超时要调大（我用 120 秒）。
- 响应 JSON 在不同版本结构不同，要做多路径兜底解析。

上传这块原本已经支持"单张失败不影响整批继续"，但对于 20MB 左右的大图，只有超时还不够，临时网络波动也很常见。所以我又补了两层保护：

1. 上传请求也做了有上限的重试和退避。
2. 只对明显的临时故障重试，比如超时、429、502、503、504。

这点很重要：不能把所有失败都重试。像 API key 错误、权限错误、参数错误这类问题，重试只会浪费时间。

最终结果是，上传链路和下载链路都变成了统一思路：

- 临时故障自动重试。
- 单条失败保留到结果文件。
- 整批任务尽量继续向前推进。

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

如果你也会遇到大图，建议把配置里的超时显式调大：

```yaml
pixiv:
  timeout_seconds: 120

chevereto:
  timeout_seconds: 120
```

现在这套流程的容错思路可以概括成一句话：

> 不追求"零失败"，而是追求"单条失败不拖垮整批"。

这和一开始的设计目标是一致的：把流程拆成原子步骤，再给每一步补上足够清晰的失败边界和结果文件。

## 总结

这套流程的价值不在于"全自动"，而在于把高重复、低价值的步骤彻底标准化，把真正需要判断的环节保留给人。对我来说，这已经足够稳定，能长期复用。

::: info

参考资料：
- [pixiv-crawl 源码](https://github.com/icestream32/pixiv-crawl)

:::
