import { clientMeta, cors, json } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }
  const m = clientMeta(req)
  json(res, 200, {
    object: "my-ip-geolocation",
    ip: m.ip,
    family: m.family,
    country: m.country,
    region: m.region,
    city: m.city,
    latitude: m.latitude,
    longitude: m.longitude,
    timezone: m.timezone,
    postal: m.postal,
    as_number: m.as_number,
    edge: m.edge,
    measured_at: m.measured_at,
  })
}
