import { cors } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  const url = new URL(req.url || "/", "http://localhost")
  const n = Math.min(Math.max(Number(url.searchParams.get("bytes") || 262144), 1024), 2 * 1024 * 1024)
  const bytes = Buffer.alloc(n, 0x61)
  res.setHeader("content-type", "application/octet-stream")
  res.setHeader("content-length", String(n))
  res.setHeader("alt-svc", 'h3=":443"; ma=86400')
  res.end(bytes)
}
