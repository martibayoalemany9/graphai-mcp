import { clientMeta, cors, json } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  const m = clientMeta(req)
  json(res, 200, {
    service: "graphai-mcp",
    purpose: "Dummy Graphai MCP webservice mirroring check-wireguard probes.",
    measured_at: m.measured_at,
    client: m,
    check_wireguard: "https://check-wireguard.graphai.eu/",
  })
}
