---
title: OpenAPI Spec 合并与统一 SDK 生成实践
isOriginal: true
order: 16
category:
    - 计算机
tag:
    - openapi
    - sdk
    - typescript
    - openapi-merge
---

当项目中有多个 OpenAPI 规范文件时，为每个模块生成独立的 SDK 会导致代码重复和维护困难。本文介绍如何使用 openapi-merge-cli 将多个 OpenAPI spec 合并为一个，然后使用 OpenAPI Generator 生成统一的 TypeScript SDK。

<!-- more -->

## 问题背景

在实际项目中，API 往往按模块划分：

```
docs/
  ├── openapi-v1-user.yaml
  ├── openapi-v1-bug.yaml
  ├── openapi-v1-module.yaml
  ├── openapi-v1-testcase.yaml
  └── openapi-v1-execution-requirement.yaml
```

为每个文件单独生成 SDK 会产生以下问题：

* 多个 SDK 目录，依赖重复
* API 类型定义不统一
* 维护成本高

## 解决方案：合并 Spec + 统一生成

### 1. 安装依赖

```bash
npm install --save-dev @openapitools/openapi-generator-cli
npm install --save-dev openapi-merge-cli
```

### 2. 配置合并规则

创建 `openapi-merge.json` 配置文件：

```json
{
  "$schema": "https://raw.githubusercontent.com/apisearch-io/openapi-merge/main/schema.json",
  "merge": {
    "inputs": [
      {
        "point": "paths",
        "file": "openapi-v1-user.yaml"
      },
      {
        "point": "paths",
        "file": "openapi-v1-bug.yaml"
      },
      {
        "point": "paths",
        "file": "openapi-v1-module.yaml"
      },
      {
        "point": "paths",
        "file": "openapi-v1-testcase.yaml"
      },
      {
        "point": "paths",
        "file": "openapi-v1-execution-requirement.yaml"
      }
    ],
    "overwrite": {
      "info": {
        "title": "统一 API SDK",
        "version": "1.0.0"
      }
    }
  }
}
```

### 3. 执行合并

```bash
cd src/zentao-sdk/docs
npx openapi-merge-cli --config openapi-merge.json
```

合并后的文件 `openapi-v1-merged.yaml` 包含所有模块的 API 定义。

### 4. 生成统一 SDK

```bash
openapi-generator-cli generate \
  -i openapi-v1-merged.yaml \
  -g typescript-axios \
  -o ../../zentao-sdk
```

生成的 SDK 结构：

```
zentao-sdk/
  ├── api.ts              # 所有 API 接口
  ├── base.ts
  ├── common.ts
  ├── configuration.ts
  ├── index.ts            # 统一导出
  └── ...
```

### 5. 一键脚本

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "sdk:merge": "cd src/zentao-sdk/docs && npx openapi-merge-cli --config openapi-merge.json",
    "sdk:generate": "openapi-generator-cli generate -i src/zentao-sdk/docs/openapi-v1-merged.yaml -g typescript-axios -o src/zentao-sdk",
    "sdk:build": "npm run sdk:merge && npm run sdk:generate"
  }
}
```

## 清理生成产物

生成后需要清理不必要的文件：

```bash
# 删除自动生成的 API 文档
rm -rf src/zentao-sdk/docs/*.md

# 删除 Git 推送脚本
rm -f src/zentao-sdk/git_push.sh

# 删除生成器元数据
rm -rf src/zentao-sdk/.openapi-generator/
```

更新 `.openapi-generator-ignore` 避免后续重新生成：

```
docs/*.md
git_push.sh
.openapi-generator/
```

## 使用示例

```typescript
import { DefaultApi } from "./zentao-sdk";

// 初始化客户端
const api = new DefaultApi({
  basePath: "https://your-zentao-instance/api.php/v1",
  apiKey: "your-session-token",
});

// 获取用户列表
const users = await api.listUsers();
console.log(users.data);

// 获取 Bug 列表
const bugs = await api.listBugs();
console.log(bugs.data);
```

## 合并策略详解

### paths 合并

多个 spec 中的 `paths` 会自动合并，相同路径和方法的 API 会被覆盖（以后面的文件为准）。

### components 合并

* `schemas`：同名字段会被覆盖
* `responses`：同名字段会被覆盖
* `parameters`：同名字段会被覆盖
* `securitySchemes`：会合并

### info 覆盖

通过 `overwrite.info` 可以统一指定合并后的 API 信息：

```json
"overwrite": {
  "info": {
    "title": "统一 API SDK",
    "version": "1.0.0",
    "description": "所有模块的统一 API 客户端"
  }
}
```

## 注意事项

### 路径冲突

如果多个 spec 定义了相同的路径但方法不同（如一个定义了 GET /users，另一个定义了 POST /users），合并后两者都会保留。

### 标签冲突

确保不同模块的 API 使用不同的标签，便于生成后区分模块。

### 版本管理

合并后的 spec 建议保留原始文件，便于后续增量更新和重新合并。

## 总结

通过 openapi-merge-cli + OpenAPI Generator 的组合，可以实现：

* **统一 SDK**：一个 SDK 包含所有模块 API
* **类型共享**：避免重复的类型定义
* **易于维护**：API 变更时重新合并生成即可

该方案特别适合微服务架构或多模块项目的 API SDK 管理。

::: info

* [openapi-merge-cli GitHub](https://github.com/apisearch-io/openapi-merge)
* [OpenAPI Generator 官方文档](https://openapi-generator.tech/)
* [OpenAPI 3.0 规范](https://spec.openapis.org/oas/v3.0.3)

:::