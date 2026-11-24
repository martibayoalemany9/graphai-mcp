import { callTool, listTools } from "./tools.mjs"
import { captureException } from "./sentry.mjs"

export async function handleJsonRpc(body) {
  const id = body?.id ?? null
  const method = body?.method
  try {
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "Graphai", version: "0.1.1" },
        },
      }
    }
    if (method === "notifications/initialized") return null
    if (method === "tools/list") {
      return { jsonrpc: "2.0", id, result: { tools: listTools() } }
    }
    if (method === "tools/call") {
      const result = await callTool(body?.params?.name, body?.params?.arguments || {}, body?.headers || {})
      return { jsonrpc: "2.0", id, result }
    }
    if (method === "ping") return { jsonrpc: "2.0", id, result: {} }
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } }
  } catch (err) {
    await captureException(err)
    return { jsonrpc: "2.0", id, error: { code: -32001, message: String(err.message || err) } }
  }
}
