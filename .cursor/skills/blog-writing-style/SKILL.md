---
name: blog-writing-style
description: "icestream32 的博客写作风格规范。当用户要求撰写博客文章、技术笔记、学习记录，或需要生成 Markdown 内容放入博客仓库时，必须使用此技能。触发场景包括：写博客、写文章、写笔记、生成 blog post、创建新的 md 文件到 src/ 目录下、帮我写一篇关于 X 的文章、总结成博客等。即使用户没有明确说「按照我的风格」，只要输出目标是博客仓库中的 Markdown 文件，就应当自动应用此技能。"
---

# icestream32 博客写作风格规范

本技能定义了 icestream32 个人博客的写作排版风格与习惯，基于对博客仓库中 15+ 篇文章的系统分析总结而成。博客基于 VuePress + vuepress-theme-hope 构建。

---

## 一、Frontmatter 格式

每篇文章以 YAML frontmatter 开头，字段顺序与规范如下：

```yaml
---
title: 文章完整标题
shortTitle: 简短标题（可选，标题较长时使用）
isOriginal: true
order: 数字（控制排序）
cover: 封面图片 URL（可选）
category:
    - 一级分类
    - 二级分类
tag:
    - 标签1
    - 标签2
    - 标签3
---
```

**规则：**
- `isOriginal: true` 始终存在
- `category` 和 `tag` 使用 4 空格缩进的 YAML 列表
- 分类层级：一级通常是 `计算机`、`音乐`，二级是具体领域如 `AI`、`Web`、`钢琴`、`读书笔记`
- 标签是具体技术词或主题词，3-6 个为宜
- `cover` 图片来源通常是 `https://images.icestream32.cn/images/...`

---

## 二、文章开篇结构

Frontmatter 之后紧跟一段引言，再加 `<!-- more -->` 折叠标记：

```markdown
---
（frontmatter）
---

一段简洁的引言，概括本文要讲什么。一般 1-2 句话，直接说明背景或目的。

<!-- more -->
```

引言风格：
- 直接陈述，不需要花哨的开头
- 说明"本文将介绍..."或描述遇到的问题/场景
- 不使用 emoji
- 中英文之间加空格，如：`MCP 协议`、`Go 语言`

---

## 三、标题层级与编号

### 技术长文（posts 目录下的文章）

大章节使用中文数字编号：

```markdown
## 一、为什么需要 MCP？
## 二、MCP 能实现什么？
## 三、核心架构
## 四、三大核心能力
...
## 总结
```

小节使用 `###` 搭配数字或描述性标题：

```markdown
### 1. 会话 Token 存储
### 2. 认证中间件
```

或者直接使用描述性标题：

```markdown
### 安装 SDK
### 配置 Claude Desktop
```

### 读书笔记（notes 目录）

章节标题不一定使用中文数字编号，可以直接使用描述性标题：

```markdown
## 初版Mutex
## 多给新goroutine一点机会
## 多给竞争者一些机会
```

### 学习笔记（music 等目录）

结构较短，直接用 `##` 分节即可：

```markdown
## 音阶
## 音程
## 练习
```

---

## 四、正文写作风格

### 语言与口吻

- **第一人称**视角：`本人`、`我`、`我们`
- **轻松自然**：不是学术论文，偶尔可以有括号吐槽，如 `（买不起钢琴，悲）`、`十分的艰辛了。。。`
- **中文为主**，技术术语保留英文原文
- **中英文之间加空格**：`使用 Docker 部署`、`Go 语言的 Mutex`、`HTTP 200`
- **不使用 emoji**
- 数字与中文之间加空格：`3000 万条数据`、`500 毫秒`

### 段落与列表

- 段落简洁，一个自然段 2-4 句话
- 使用无序列表 `-` 枚举要点（不使用 `*`，但在某些文章中偶尔出现 `*`，两者均可）
- 有序列表用 `1. 2. 3.` 表示步骤
- 列表项可以加粗关键词：`- **碎片化集成**：每个 AI 应用都需要...`

### 代码块

- 始终标注语言类型：` ```typescript `、` ```go `、` ```bash `、` ```json `、` ```yaml `、` ```sql `
- 代码前后有简短的文字说明
- 代码注释使用中文
- 对于同一功能的多语言实现，使用 tabs 容器：

```markdown
::: tabs

@tab TypeScript

` `` `ts
// TypeScript 实现
` `` `

@tab Golang

` `` `go
// Go 实现
` `` `

:::
```

### 表格

频繁使用 Markdown 表格做对比、汇总、参数说明：

```markdown
| 维度 | 方案A | 方案B |
|------|-------|-------|
| 性能 | 较高  | 一般  |
| 复杂度 | 低  | 高   |
```

### 图片

使用标准 Markdown 语法，图床是 `images.icestream32.cn`：

```markdown
![描述文字](https://images.icestream32.cn/images/年/月/日/文件名.png)
```

### Mermaid 图表

用于展示流程图，风格为 `flowchart LR`（从左到右）：

```markdown
` `` `mermaid
flowchart LR
    A[步骤1] --> B[步骤2]
    B --> C[步骤3]
    
    style A fill:#e1f5fe
    style C fill:#e8f5e8
` `` `
```

---

## 五、VuePress 容器使用

博客使用 vuepress-theme-hope 的容器语法，常见用法：

### ::: tip
用于提示、补充说明：

```markdown
::: tip
在装好 CPU、主板后，可以先测试主板是否正常工作。
:::
```

可以带标题：

```markdown
::: tip 安全性
- 前向安全性：每次会话使用临时密钥对
- 身份认证：通过数字证书确保服务端身份的可信性
:::
```

### ::: important
用于强调重要概念或关键结论：

```markdown
::: important
**Unlock 方法可以被任意的 goroutine 调用释放锁，即使是没持有这个互斥锁的 goroutine，也可以进行这个操作。**

**因此，我们在开发中一定要遵循"谁加锁，谁释放"的原则。**
:::
```

### ::: warning
用于警告信息：

```markdown
::: warning
**生产环境建议**：自定义认证仅适用于内部或测试场景。
:::
```

### ::: info
**放在文章末尾**，用于参考资料和封面来源：

```markdown
::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/xxxxx) <br>
参考资料：[XXX 官方文档](https://xxx.com/)

:::
```

或者只有参考资料：

```markdown
::: info

参考资料：
- [链接1](URL)
- [链接2](URL)

:::
```

### ::: details
用于可折叠内容，如长代码或输出结果：

```markdown
::: details 点击查看代码
` `` `ts
// 长代码...
` `` `
:::
```

---

## 六、文章结尾模式

每篇文章的结尾遵循固定模式：

```markdown
## 总结

对全文内容做简要回顾，1-3 段话。可以包含个人感悟、后续展望。

::: info

封面来源：[Pixiv](https://www.pixiv.net/artworks/xxxxx) <br>
参考书籍/文档：[《书名》](购买链接)

:::
```

**注意：**
- `## 总结` 是固定标题
- `::: info` 容器是文章最后一个元素
- 封面来源和参考资料之间用 `<br>` 换行
- 如果没有封面，只放参考资料
- 参考资料多于 2 个时使用列表格式

---

## 七、文件命名与目录规范

- 文件名使用英文小写 + 连字符：`mcp-introduction.md`、`mutex-source-1.md`
- 目录结构：
  - `src/posts/` — 博客文章（技术实践、问题解决）
  - `src/notes/` — 读书笔记（设计模式、并发编程等）
  - `src/music/` — 音乐学习记录
  - `src/language/` — 语言学习
- 每个子目录有 `README.md` 作为目录页，包含 frontmatter 但不含正文内容

---

## 八、写作模板

### 技术实践文章模板

```markdown
---
title: 文章标题
shortTitle: 简短标题
isOriginal: true
order: 数字
category:
    - 计算机
    - 具体领域
tag:
    - 标签1
    - 标签2
---

一段简洁的引言，概括本文主题。

<!-- more -->

## 一、背景/问题

描述问题背景或需求。

## 二、解决方案/核心实现

具体的技术方案和代码。

## 三、更多细节

深入讲解。

## 总结

回顾全文，个人感悟。

::: info

参考资料：
- [链接](URL)

:::
```

### 问题排查文章模板

```markdown
---
title: XXX 问题排查与解决
isOriginal: true
order: 数字
category:
    - 计算机
tag:
    - 相关技术
---

记录一次 XXX 问题的排查过程。

<!-- more -->

## 问题现象

描述遇到的问题。

## 排查过程

### 第一步：检查 XXX

分析过程。

### 第二步：XXX

进一步排查。

## 解决方案

具体的修复步骤。

## 总结

| 现象 | 原因 |
|------|------|
| XXX  | XXX  |

::: info

参考资料：
- [链接](URL)

:::
```

### 读书笔记模板

```markdown
---
title: 章节名称
isOriginal: true
order: 数字
cover: 封面图片URL
category:
    - 计算机
    - 读书笔记
    - 书名/系列名
tag:
    - 标签
---

一句话概括本章内容。

<!-- more -->

## 概念/章节一

讲解内容，配合代码示例。

## 概念/章节二

更多内容。

## 总结

个人理解与思考。

::: info

封面来源：[Pixiv](URL) <br>
参考资料：[《书名》](购买链接)

:::
```
