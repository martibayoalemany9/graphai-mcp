import { handleJsonRpc } from "../src/rpc.mjs"
import { cors } from "../lib/client-meta.js"

export default async function handler(req, res) {
  cors(res)
  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method === "GET") {
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({ ok: true, name: "Graphai", transport: "streamable-http" }))
    return
  }
  if (req.method !== "POST") {
    res.statusCode = 405
    res.end(JSON.stringify({ error: "method_not_allowed" }))
    return
  }
  const chunks = []
  for await (const c of req) chunks.push(c)
  let body = {}
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
  } catch {
    res.statusCode = 400
    res.end(JSON.stringify({ error: "invalid_json" }))
    return
  }
  const out = await handleJsonRpc(body, req.headers)
  res.setHeader("content-type", "application/json")
  res.end(JSON.stringify(out))
}
