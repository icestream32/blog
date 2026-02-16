---
title: OpenAPI Generator 报错 "Error.items is missing" 解决方案
isOriginal: true
order: 15
category:
    - 计算机
tag:
    - openapi
    - swagger
    - openapi-generator
    - typescript
---

在使用 OpenAPI Generator 生成 TypeScript SDK 时，经常会遇到各种 schema 解析错误。其中 `components.schemas.Error.items is missing` 是一个典型的错误，通常发生在 Error 模型的定义不符合 OpenAPI 规范时。本文将详细分析该错误的成因并提供解决方案。

<!-- more -->

## 错误现象

执行 OpenAPI Generator 命令时出现如下错误：

```
error: error generating schema...
components.schemas.Error.items is missing
```

或者在 CI/CD 流水线中看到类似的报错信息。

## 错误原因分析

### 根本原因

该错误的根本原因是 **Error 模型被 OpenAPI Generator 解析为数组类型**，但定义中缺少 `items` 属性。

通常这种情况发生在以下定义方式：

```yaml
Error:
  type: object
  properties:
    error:
      oneOf:
        - type: string
        - type: object
        - type: array  # 问题所在！
```

当 `oneOf` 中包含 `type: array` 时，OpenAPI Generator 会将整个 `error` 字段视为数组类型，并期望找到 `items` 子属性来定义数组元素的类型。

### 为什么这不是问题在手动代码中？

在手动编写的 TypeScript 代码中，你可以这样定义：

```typescript
interface Error {
  error: string | object | any[];
}
```

但 OpenAPI Generator 的解析逻辑更为严格，它需要明确的 schema 定义来生成正确的类型代码。

## 解决方案

### 方案一：简化 Error 定义（推荐）

将 `oneOf` 改为单一的 `type: string`，因为在大多数场景下，错误信息本身就是字符串：

```yaml
Error:
  type: object
  properties:
    error:
      type: string  # 移除 oneOf，改为单一类型
```

如果需要保留更多信息，可以考虑增加额外的字段：

```yaml
Error:
  type: object
  properties:
    code:
      type: integer
    message:
      type: string
    details:
      type: object
```

### 方案二：移除 oneOf 中的 array 类型

如果业务上确实需要支持数组类型的错误信息，可以将 `oneOf` 拆分为独立字段：

```yaml
Error:
  type: object
  properties:
    error:
      type: string
    errorList:
      type: array
      items:
        type: string
```

### 方案三：使用 anyOf 替代 oneOf

某些场景下，`anyOf` 可能比 `oneOf` 更灵活：

```yaml
Error:
  type: object
  properties:
    error:
      anyOf:
        - type: string
        - type: object
```

## 完整修复示例

以下是实际项目中的修复对比：

### 修复前

```yaml
openapi-v1-user.yaml
components:
  schemas:
    Error:
      type: object
      properties:
        code:
          type: integer
        error:
          oneOf:
            - type: string
            - type: object
            - type: array
```

### 修复后

```yaml
openapi-v1-user.yaml
components:
  schemas:
    Error:
      type: object
      properties:
        code:
          type: integer
        error:
          type: string
```

## OpenAPI Generator 常用命令

### 生成 TypeScript SDK

```bash
# 使用 Axios 客户端模板
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./sdk

# 使用 Fetch 客户端模板
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./sdk
```

### 查看所有可用生成器

```bash
openapi-generator-cli list
```

### 查看生成器配置选项

```bash
openapi-generator-cli config-help -g typescript-axios
```

### 使用配置文件

```json
// openapitools.json
{
  "$schema": "https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/modules/openapi-generator/src/main/resources/openapitools.json",
  "spaces": 2,
  "generator-cli": {
    "generators": {
      "typescript-sdk": {
        "generatorName": "typescript-axios",
        "inputSpec": "openapi.yaml",
        "output": "./sdk",
        "additionalProperties": {
          "npmName": "my-api-sdk",
          "npmVersion": "1.0.0"
        }
      }
    }
  }
}
```

## 最佳实践

### 1. 规范先行

在编写 OpenAPI spec 之前，先熟悉 OpenAPI 3.0 规范中关于 Schema 的定义规则。

### 2. 使用验证工具

在保存 OpenAPI 文件之前，使用以下工具进行验证：

```bash
# 使用 Swagger Editor 在线验证
# 或使用命令行工具
npx @apidevtools/swagger-cli validate openapi.yaml
```

### 3. 最小化 oneOf / anyOf 使用

过度使用 `oneOf` 和 `anyOf` 会增加生成器的解析难度。尽量使用简单的类型定义。

### 4. 保持一致性

在整个项目中保持 Error 模型的定义风格一致，避免不同接口返回不同格式的错误信息。

## 总结

`components.schemas.Error.items is missing` 错误的根本原因是 OpenAPI schema 中 `oneOf` 包含 `type: array` 但缺少 `items` 定义。解决方案是简化 Error 模型，将 `error` 字段改为单一的 `type: string`，或拆分数组类型的定义。

在编写 OpenAPI spec 时，应尽量避免复杂的 `oneOf` / `anyOf` 结构，保持定义的简洁和规范性。

## 参考资料

* [OpenAPI Generator 官方文档](https://openapi-generator.tech/docs/usage/)
* [OpenAPI 3.0 Schema Object 规范](https://spec.openapis.org/oas/v3.0.3#schema-object)
