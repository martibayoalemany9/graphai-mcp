import { clientMeta, cors, json } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }
  const m = clientMeta(req)
  json(res, 200, { object: "my-ip", ip: m.ip, family: m.family, ipv4: m.ipv4, ipv6: m.ipv6, measured_at: m.measured_at })
}
