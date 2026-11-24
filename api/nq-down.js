import { cors } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  const bytes = Buffer.alloc(256 * 1024, 0)
  res.setHeader("content-type", "application/octet-stream")
  res.setHeader("content-length", String(bytes.length))
  res.setHeader("alt-svc", 'h3=":443"; ma=86400')
  res.end(bytes)
}
