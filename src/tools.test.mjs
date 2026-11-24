import assert from "node:assert/strict"
import test from "node:test"
import { createServer } from "node:http"
import { handleHttp } from "./http.mjs"
import { handleJsonRpc } from "./rpc.mjs"
import { callTool, listTools } from "./tools.mjs"

function start() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => handleHttp(req, res))
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      process.env.GRAPHAI_ORIGIN = `http://127.0.0.1:${port}`
      resolve(server)
    })
  })
}

test("initialize names Graphai", async () => {
  const r = await handleJsonRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
  assert.equal(r.result.serverInfo.name, "Graphai")
})

test("tools/list includes latency speed my_ip geo and check-wireguard probes", async () => {
  const names = listTools().map((t) => t.name)
  for (const n of [
    "latency",
    "speed",
    "my_ip",
    "my_ip_geolocation",
    "ipv4",
    "ipv6",
    "path_sample",
    "network_quality",
    "http2",
    "http3",
    "video_stream",
    "stats",
    "check_wg_ip",
    "check_wg_stats",
    "queries",
  ]) {
    assert.ok(names.includes(n), n)
  }
})

test("local webservice my-ip, geo, latency, speed, nq", async () => {
  const server = await start()
  try {
    const ip = await callTool("my_ip", {})
    assert.match(ip.content[0].text, /my-ip/)
    const geo = await callTool("my_ip_geolocation", {})
    assert.match(geo.content[0].text, /country/)
    const lat = await callTool("latency", { samples: 2 })
    assert.match(lat.content[0].text, /median=/)
    assert.match(lat.content[0].text, /\| # \| ms \|/)
    const spd = await callTool("speed", { bytes: 4096 })
    assert.match(spd.content[0].text, /mbps/)
    const nq = await callTool("network_quality", { samples: 2 })
    assert.match(nq.content[0].text, /download/)
    const vid = await callTool("video_stream", { samples: 2 })
    assert.match(vid.content[0].text, /video_stream/)
    const h2 = await callTool("http2", { samples: 1 })
    assert.match(h2.content[0].text, /http2/)
  } finally {
    server.close()
  }
})
