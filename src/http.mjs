import { createServer } from "node:http"
import { handleJsonRpc } from "./rpc.mjs"
import ping from "../api/ping.js"
import speed from "../api/speed.js"
import myIp from "../api/my-ip.js"
import myGeo from "../api/my-ip-geolocation.js"
import ip from "../api/ip.js"
import stats from "../api/stats.js"
import probe from "../api/probe.js"
import nqPing from "../api/nq-ping.js"
import nqDown from "../api/nq-down.js"
import nqUp from "../api/nq-up.js"
import upload from "../api/upload.js"

const routes = {
  "/api/ping": ping,
  "/latency": ping,
  "/api/speed": speed,
  "/speed": speed,
  "/api/my-ip": myIp,
  "/my-ip": myIp,
  "/api/my-ip-geolocation": myGeo,
  "/my-ip-geolocation": myGeo,
  "/api/ip": ip,
  "/api/stats": stats,
  "/api/probe": probe,
  "/api/nq-ping": nqPing,
  "/api/nq-down": nqDown,
  "/api/nq-up": nqUp,
  "/api/upload": upload,
}

export async function handleHttp(req, res) {
  const url = new URL(req.url || "/", "http://localhost")
  if (req.method === "POST" && (url.pathname === "/mcp" || url.pathname === "/")) {
    const chunks = []
    for await (const c of req) chunks.push(c)
    let body = {}
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")
    } catch {
      res.writeHead(400, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "invalid_json" }))
      return
    }
    body.headers = Object.fromEntries(
      Object.entries(req.headers || {}).map(([k, v]) => [String(k).toLowerCase(), Array.isArray(v) ? v[0] : v]),
    )
    const out = await handleJsonRpc(body)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(out))
    return
  }
  const fn = routes[url.pathname]
  if (fn) {
    req.url = url.pathname + url.search
    await fn(req, res)
    return
  }
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({ ok: true, name: "Graphai" }))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 8790)
  createServer((req, res) => handleHttp(req, res).catch((e) => {
    res.writeHead(500)
    res.end(String(e))
  })).listen(port, "127.0.0.1", () => console.error(`graphai-mcp http://127.0.0.1:${port}`))
}
