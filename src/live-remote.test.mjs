import assert from "node:assert/strict"
import test from "node:test"

const live = process.env.MCP_LIVE === "1"
const URL = process.env.GRAPHAI_MCP_URL || "https://graphai-mcp.vercel.app/mcp"
const REGISTRY = "https://registry.modelcontextprotocol.io/v0.1/servers?search=eu.graphai/check-wireguard"

async function rpc(method, params = {}) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

test("check-wireguard production initialize", { skip: !live }, async () => {
  const { status, body } = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "graphai-mcp-ci", version: "0.1.0" },
  })
  assert.equal(status, 200)
  assert.equal(body.result.serverInfo.name, "Graphai")
})

test("check-wireguard production ping", { skip: !live }, async () => {
  const { status, body } = await rpc("ping")
  assert.equal(status, 200)
  assert.ok(body.result)
})

test("check-wireguard tools/list has latency and login", { skip: !live }, async () => {
  const { body } = await rpc("tools/list")
  const names = (body.result?.tools || []).map((t) => t.name)
  for (const n of ["latency", "speed", "my_ip", "check_wg_ip", "login"]) {
    assert.ok(names.includes(n), n)
  }
})

test("check-wireguard registry listing eu.graphai/check-wireguard", { skip: !live }, async () => {
  const res = await fetch(REGISTRY)
  assert.equal(res.ok, true)
  const data = await res.json()
  const names = (data.servers || []).map((s) => s.server?.name)
  assert.ok(names.includes("eu.graphai/check-wireguard"), JSON.stringify(names))
})
