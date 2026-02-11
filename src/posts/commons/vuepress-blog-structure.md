---
title: VuePress 博客结构
isOriginal: true
order: 12
category:
    - 计算机
    - 博客
tag:
    - VuePress
    - 博客
    - Frontmatter
---

VuePress 2 配合 vuepress-theme-hope 主题，为技术博客提供了优雅的解决方案。了解其文章结构和 Frontmatter 元数据规范是创建高质量博客文章的基础。

<!-- more -->

## 目录结构

```
blog_repo/
├── src/
│   └── posts/
│       └── commons/
│           └── <文章>.md
├── package.json
└── README.md
```

文章统一存放在 `src/posts/commons/` 目录下。

## Frontmatter 元数据

每篇文章必须包含以下 Frontmatter 字段：

```yaml
---
title: 文章标题
isOriginal: true
order: 数字
category:
    - 计算机
    - 分类名
tag:
    - 标签1
    - 标签2
---
```

可选字段：
- `cover`: 封面图 URL

### order 字段说明

`order` 字段用于控制文章在列表中的显示顺序，建议按以下规则设置：
- 新文章 order 值取现有最大值 +1
- 或根据文章重要程度和分类手动排序

## 文章正文结构

```
摘要段落（1-3 句，用于列表预览）

<!-- more -->

## 小节标题

正文内容...

### 代码示例

```bash
具体命令
```

## 延伸阅读

- 链接或参考
```

`<!-- more -->` 标签用于在列表页面显示摘要，点击"阅读更多"查看完整内容。

## 构建命令

```bash
npm run docs:build
```

构建完成后，生成的静态文件可以部署到任何静态网站托管服务。

## 延伸阅读

- [VuePress 官方文档](https://vuepress.vuejs.org/)
- [vuepress-theme-hope 文档](https://theme-hope.vuejs.org/)
