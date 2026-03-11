---
title: MySQL JSON 操作速查表
isOriginal: true
category:
    - 计算机
    - 数据库
tag:
    - MySQL
    - JSON
    - 后端开发
    - 数据库
---

整理了一份 MySQL JSON 操作速查表，覆盖查询、判断、修改、数组操作等 90% 以上的日常场景。这些都是我在后端开发中实际用到的 SQL 模板，可以直接复制使用。

<!-- more -->

## 一、核心口诀

先记住这个口诀，后面用起来会顺手很多：

```
取值        ->>
取 JSON      ->
判断路径    JSON_CONTAINS_PATH
判断包含    JSON_CONTAINS
新增/修改    JSON_SET
只新增      JSON_INSERT
只修改      JSON_REPLACE
删除字段    JSON_REMOVE
数组追加    JSON_ARRAY_APPEND
数组长度    JSON_LENGTH
JSON 转表    JSON_TABLE
```

## 二、读取 JSON 数据

假设表结构如下：

```sql
table: device
column: attributes (JSON)
```

示例 JSON：

```json
{
  "name": "printer",
  "isPrintSN": true,
  "network": {
    "type": "wifi"
  }
}
```

### 获取 JSON 对象

```sql
SELECT attributes->'$.network'
FROM device;
```

返回：

```json
{"type":"wifi"}
```

### 获取 JSON 值（字符串）

```sql
SELECT attributes->>'$.name'
FROM device;
```

返回：

```
printer
```

::: tip

操作符区别：

| 操作符 | 含义 |
|--------|------|
| `->` | 返回 JSON 对象 |
| `->>` | 返回字符串 |

:::

### 标准写法

```sql
SELECT JSON_EXTRACT(attributes, '$.name')
FROM device;
```

等价于：

```sql
attributes->'$.name'
```

## 三、判断 JSON 内容

### 判断字段存在

```sql
SELECT *
FROM device
WHERE JSON_CONTAINS_PATH(attributes, 'one', '$.isPrintSN');
```

### 判断字段不存在

```sql
SELECT *
FROM device
WHERE JSON_CONTAINS_PATH(attributes, 'one', '$.isPrintSN') = 0;
```

### 判断值

```sql
SELECT *
FROM device
WHERE attributes->>'$.isPrintSN' = 'true';
```

### 判断 NULL

```sql
SELECT *
FROM device
WHERE attributes->>'$.isPrintSN' IS NULL;
```

这会匹配两种情况：

```json
{}
{"isPrintSN": null}
```

::: important

`->>` 和 `JSON_CONTAINS_PATH` 的区别：

- `attributes->>'$.isPrintSN' IS NULL`：字段不存在 **或** 字段值为 null
- `JSON_CONTAINS_PATH(..., 'one', '$.isPrintSN') = 0`：**只匹配** 字段不存在

:::

## 四、修改 JSON

### 修改 / 新增字段（最常用）

```sql
UPDATE device
SET attributes = JSON_SET(attributes, '$.isPrintSN', true);
```

特点：

- 字段不存在 → 新增
- 字段存在 → 覆盖

### 只新增字段（如果不存在）

```sql
UPDATE device
SET attributes = JSON_INSERT(attributes, '$.isPrintSN', true);
```

特点：

- 存在 → 不修改
- 不存在 → 新增

### 只修改已存在字段

```sql
UPDATE device
SET attributes = JSON_REPLACE(attributes, '$.isPrintSN', true);
```

特点：

- 存在 → 修改
- 不存在 → 不变

### 删除字段

```sql
UPDATE device
SET attributes = JSON_REMOVE(attributes, '$.isPrintSN');
```

## 五、JSON 数组操作

示例：

```json
{
  "tags": ["iot", "factory"]
}
```

### 追加数组

```sql
UPDATE device
SET attributes = JSON_ARRAY_APPEND(attributes, '$.tags', 'printer');
```

结果：

```json
["iot", "factory", "printer"]
```

### 插入数组

```sql
UPDATE device
SET attributes = JSON_ARRAY_INSERT(attributes, '$.tags[1]', 'device');
```

结果：

```json
["iot", "device", "factory"]
```

### 获取数组长度

```sql
SELECT JSON_LENGTH(attributes, '$.tags')
FROM device;
```

## 六、JSON 查询

### JSON 包含某个值

```sql
SELECT *
FROM device
WHERE JSON_CONTAINS(attributes, '"printer"', '$.tags');
```

### 判断 JSON 是否包含对象

```sql
SELECT *
FROM device
WHERE JSON_CONTAINS(
    attributes,
    '{"type":"wifi"}',
    '$.network'
);
```

## 七、JSON 类型判断

```sql
SELECT JSON_TYPE(attributes->'$.network')
FROM device;
```

可能返回：

| 返回值 | 含义 |
|--------|------|
| OBJECT | JSON 对象 |
| ARRAY | 数组 |
| STRING | 字符串 |
| INTEGER | 数字 |
| BOOLEAN | 布尔 |
| NULL | null |

## 八、JSON 转换

### JSON → 表结构（MySQL 8）

```sql
SELECT *
FROM JSON_TABLE(
    attributes,
    '$'
    COLUMNS(
        name VARCHAR(50) PATH '$.name',
        isPrintSN BOOLEAN PATH '$.isPrintSN'
    )
) AS jt;
```

用于：

- JSON 转表
- 报表查询
- ETL

## 九、生产环境常用模板

### 给 JSON 补默认字段

```sql
UPDATE device
SET attributes = JSON_SET(attributes, '$.isPrintSN', true)
WHERE JSON_CONTAINS_PATH(attributes, 'one', '$.isPrintSN') = 0;
```

### 查 JSON 字段不等于某值

```sql
SELECT *
FROM device
WHERE CAST(attributes->>'$.networkType' AS UNSIGNED) != 2;
```

### JSON 批量修复

```sql
UPDATE device
SET attributes = JSON_SET(attributes, '$.version', '1.0')
WHERE attributes->>'$.version' IS NULL;
```

## 十、性能优化

如果 JSON 查询很多，建议建 **虚拟列索引**。

例如：

```sql
ALTER TABLE device
ADD COLUMN isPrintSN TINYINT
GENERATED ALWAYS AS (attributes->>'$.isPrintSN') STORED;

CREATE INDEX idx_isPrintSN
ON device(isPrintSN);
```

这样做的好处：

- JSON 查询变成普通索引查询
- 性能提升 **10-100 倍**

## 总结

这份速查表覆盖了我在后端开发中 90% 以上的 MySQL JSON 操作场景。核心就是记住那个口诀，然后根据具体场景选择合适的函数。

生产环境中最常用的还是 `JSON_SET` 补默认字段，配合 `JSON_CONTAINS_PATH` 判断字段是否存在。如果查询量大，记得用虚拟列索引优化性能。

::: info

参考资料：MySQL 8.0 JSON 函数官方文档

:::
