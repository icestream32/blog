---
title: FastMCP 自定义认证流程实现指南
isOriginal: true
order: 14
category:
    - 计算机
tag:
    - fastmcp
    - mcp
    - 认证
    - typescript
---

在使用 MCP (Model Context Protocol) 构建服务时，默认的安全机制通常基于 OAuth 2.1 或 Bearer Token。但在某些场景下，我们可能需要实现更灵活的自定义认证逻辑——比如通过自定义 HTTP 头传递账号密码，并使用会话 ID 来缓存 token，避免每次工具调用都重新认证。本文将详细介绍如何基于 FastMCP 和 HTTP Transport 实现这一流程。

<!-- more -->

## 为什么需要自定义认证？

MCP 协议的标准安全模式虽然是 OAuth 2.1，但在以下场景中自定义认证可能更合适：

* 内网服务或测试环境
* 需要快速原型验证
* 与已有认证系统集成
* 对认证流程有特殊需求

本文介绍的方案通过 **HTTP 头传递凭证** + **会话 ID 缓存 Token** 的方式，实现了轻量级的认证机制。

## 核心实现

### 1. 会话 Token 存储

使用内存 Map 存储会话与 Token 的映射关系：

```typescript
const sessionTokens = new Map<string, string>();
```

这种方案适合单进程服务，生产环境可考虑 Redis 等分布式存储。

### 2. 认证中间件

```typescript
import { Context } from "fastmcp";

async function authHandler(ctx: Context) {
  const headers = ctx.transportRequest?.headers ?? {};
  const user = headers["x-user"] as string;
  const pass = headers["x-pass"] as string;
  const sessionId = headers["mcp-session-id"] as string;

  if (!user || !pass) {
    throw new Error("Missing X-User/X-Pass headers");
  }

  // 检查会话是否已有 Token
  let token = sessionId ? sessionTokens.get(sessionId) : undefined;
  
  if (!token) {
    // 调用第三方认证服务获取 Token
    token = await getTokenFromAuthService(user, pass);
    if (sessionId) {
      sessionTokens.set(sessionId, token);
    }
  }

  // 将 Token 存入上下文供后续使用
  (ctx as any).authToken = token;
  return token;
}
```

### 3. 工具调用前的认证检查

在 MCP Tool 的 execute 函数中调用认证逻辑：

```typescript
mcp.tool({
  name: "secureEcho",
  description: "返回输入并附带认证 Token",
  parameters: { input: "string" },
  async execute({ input }, ctx: Context) {
    const token = await authHandler(ctx);
    return { echoed: input, token };
  },
});
```

### 4. 完整服务示例

```typescript
import express from "express";
import bodyParser from "body-parser";
import { FastMCP } from "fastmcp";
import { StreamableHTTPServerTransport } from "fastmcp/server/transports";

const sessionTokens = new Map<string, string>();

async function getTokenFromAuthService(user: string, pass: string) {
  // 实际场景中应调用外部鉴权服务
  return "TOK_" + user + "_" + Date.now();
}

async function authHandler(ctx: Context) {
  const headers = ctx.transportRequest?.headers ?? {};
  const user = headers["x-user"] as string;
  const pass = headers["x-pass"] as string;
  const sessionId = headers["mcp-session-id"] as string;

  if (!user || !pass) {
    throw new Error("Missing X-User/X-Pass headers");
  }

  let token = sessionId ? sessionTokens.get(sessionId) : undefined;
  if (!token) {
    token = await getTokenFromAuthService(user, pass);
    if (sessionId) sessionTokens.set(sessionId, token);
  }

  (ctx as any).authToken = token;
  return token;
}

const mcp = new FastMCP({ name: "Auth Example MCP", version: "1.0.0" });

mcp.tool({
  name: "secureEcho",
  description: "返回输入并附带认证 Token",
  parameters: { input: "string" },
  async execute({ input }, ctx: Context) {
    const token = await authHandler(ctx);
    return { echoed: input, token };
  },
});

const app = express();
app.use(bodyParser.json());

const transport = new StreamableHTTPServerTransport(mcp);
app.post("/mcp", (req, res) => transport.handlePost(req, res));
app.delete("/mcp", (req, res) => transport.handleDelete(req, res));

app.listen(3000, () => {
  console.log("MCP Auth Server listening on http://localhost:3000/mcp");
});
```

## 测试验证

使用 curl 模拟客户端请求：

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "X-User: alice" \
  -H "X-Pass: secret" \
  -d '{
    "jsonrpc":"2.0",
    "method":"callTool",
    "params": {"name":"secureEcho","arguments":{"input":"hello"}},
    "id": 1
  }'
```

首次请求会获取 Token，后续请求携带相同的 Session ID 即可复用该 Token。

## 注意事项

::: warning
**生产环境建议**：自定义认证仅适用于内部或测试场景。生产环境应使用 MCP 标准安全模式（OAuth 2.1 / Bearer Token）以确保安全性。
:::

* 会话 Token 存储在内存中，服务重启后会丢失
* 生产环境应使用 Redis 等分布式存储
* 建议对敏感凭证进行加密传输（HTTPS）
* 可结合 FastMCP 内置的 TokenVerifier / AuthProvider 做更完整的验证

## 总结

通过本文介绍的自定义认证流程，我们可以在 FastMCP 服务中实现灵活的认证机制。该方案的核心思路是：

1. **HTTP 头传递凭证** - X-User / X-Pass
2. **会话 ID 缓存 Token** - 避免重复认证
3. **工具调用前检查** - 确保每次调用都已认证

如需集成更规范的第三方认证服务（JWT / OIDC / OAuth 2.1），可基于 MCP AuthProvider 实现标准化的认证流程。

::: info

* [MCP 官方安全文档](https://modelcontextprotocol.io/docs/tutorials/security/authorization)
* [FastMCP Token Verification](https://gofastmcp.com/servers/auth/token-verification)

:::
