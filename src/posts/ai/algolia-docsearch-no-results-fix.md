---
title: Algolia DocSearch 搜索无结果问题排查与解决
shortTitle: Algolia 搜索无结果排查
isOriginal: true
order: 1
category:
  - 计算机
tag:
  - Algolia
  - DocSearch
  - VuePress
  - 搜索配置
---

记录一次 Algolia DocSearch 在 VuePress 博客中配置后返回 HTTP 200 但无搜索结果的完整排查过程。

## 问题现象

在 VuePress 博客中配置 Algolia DocSearch 后，出现以下奇怪现象：

- 浏览器 F12 控制台显示 API 请求返回 **HTTP 200**
- 但搜索结果始终为空（`hits: []`）
- 在 Algolia 控制台直接查询同一索引却能正常返回结果

<!-- more -->

## 排查过程

### 第一步：检查 facet 过滤器

HTTP 200 但无结果，这是典型的 **facet 过滤器不匹配**问题。

DocSearch 组件在发送查询时会自动附加 `facetFilters` 参数（如 `lang`、`version` 等）。如果索引记录里没有这些 facet 属性，或索引未配置对应的 `attributesForFaceting`，就会出现：

- API 返回 HTTP 200（请求本身成功）
- `hits` 数组为空（facet 过滤把所有记录都过滤掉了）
- Algolia 控制台能搜到（控制台不附加这些过滤器）

通过 F12 查看请求负载，发现：

```
facetFilters: ["lang:zh-CN"]
```

而索引记录中根本没有 `lang` 字段，导致所有 204 条记录全部被过滤。

### 第二步：使用 Algolia Crawler 重建索引

旧索引 `icestream32_pages` 是通过 VuePress 的 Algolia 插件创建的，记录结构缺少 DocSearch 所需的标准字段。

解决方案是访问 [Algolia Crawler](https://crawler.algolia.com/)，创建新爬虫任务：

- **Start URL**: `https://www.icestream32.cn`
- **Content type**: Technical documentation
- **Template**: VuePress v2

爬虫会自动生成包含 `hierarchy.lvl0-6`、`content`、`lang` 等标准 DocSearch 字段的记录。

### 第三步：配置索引属性

新索引创建后，还需要手动配置两项关键设置：

**1. Attributes for Faceting**

在索引 Configuration 中添加：
- `lang`
- `type`

状态设为 `not searchable`（Facet 属性不需要 searchable）。

**2. Searchable Attributes**

按优先级顺序添加以下字段（顺序影响搜索权重）：

```
unordered(hierarchy_radio_camel.lvl0)
unordered(hierarchy_radio.lvl0)
unordered(hierarchy_radio_camel.lvl1)
unordered(hierarchy_radio.lvl1)
unordered(hierarchy_radio_camel.lvl2)
unordered(hierarchy_radio.lvl2)
unordered(hierarchy_radio_camel.lvl3)
unordered(hierarchy_radio.lvl3)
unordered(hierarchy_camel.lvl0)
unordered(hierarchy.lvl0)
unordered(hierarchy_camel.lvl1)
unordered(hierarchy.lvl1)
unordered(hierarchy_camel.lvl2)
unordered(hierarchy.lvl2)
unordered(hierarchy_camel.lvl3)
unordered(hierarchy.lvl3)
unordered(hierarchy_camel.lvl4)
unordered(hierarchy.lvl4)
unordered(hierarchy_camel.lvl5)
unordered(hierarchy.lvl5)
unordered(hierarchy_camel.lvl6)
unordered(hierarchy.lvl6)
content
```

::: tip 注意
`content` 应该放在最底部（优先级最低），`lang`、`language`、`url` 等字段不应出现在 searchableAttributes 中。
:::

## 最终配置

完成上述配置后，搜索功能恢复正常。完整的 Crawler 配置示例：

```javascript
new Crawler({
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_API_KEY',
  rateLimit: 8,
  startUrls: ['https://YOUR_WEBSITE_URL/'],
  sitemaps: ['https://YOUR_WEBSITE_URL/sitemap.xml'],
  actions: [{
    indexName: 'YOUR_INDEX_NAME',
    pathsToMatch: ['https://YOUR_WEBSITE_URL/**'],
    recordExtractor: ({ $, helpers }) => {
      return helpers.docsearch({
        recordProps: {
          lvl0: {
            selectors: '.vp-sidebar-heading.active',
            defaultValue: 'Documentation',
          },
          lvl1: '[vp-content] h1',
          lvl2: '[vp-content] h2',
          lvl3: '[vp-content] h3',
          content: '[vp-content] p, [vp-content] li',
        },
        indexHeadings: true,
      })
    },
  }],
  initialIndexSettings: {
    YOUR_INDEX_NAME: {
      attributesForFaceting: ['type', 'lang'],
      searchableAttributes: [
        'unordered(hierarchy_radio_camel.lvl0)',
        // ... 其他字段
        'content',
      ],
    },
  },
})
```

## 总结

| 现象 | 原因 |
|------|------|
| Algolia 控制台能搜到 | 控制台不带 facet 过滤，直接全文搜索 |
| 博客搜索返回 200 但无结果 | DocSearch 自动附加 `facetFilters`，但索引记录缺少对应 facet 属性 |

**关键步骤**：

1. 使用 Algolia Crawler + VuePress v2 模板重建索引
2. 配置 `attributesForFaceting` 包含 `lang` 和 `type`
3. 按正确顺序配置 `searchableAttributes`

三步全到位，搜索才能正常工作。

## 参考资料

- [VuePress Theme Hope - DocSearch 配置](https://ecosystem.vuejs.press/zh/plugins/search/docsearch.html#injectstyles)
- [Algolia Crawler](https://crawler.algolia.com/)
