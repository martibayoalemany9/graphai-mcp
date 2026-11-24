import { clientMeta, cors, json } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  const url = new URL(req.url || "/", "http://localhost")
  const want = (url.searchParams.get("fam") || "").toLowerCase()
  const m = clientMeta(req)
  json(res, 200, {
    ip: m.ip,
    family: m.family,
    ipv4: m.ipv4,
    ipv6: m.ipv6,
    match: want ? m.family === want : true,
    wanted: want || null,
    measured_at: m.measured_at,
    edge: m.edge,
  })
}
