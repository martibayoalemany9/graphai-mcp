function header(req, name) {
  const h = req.headers || {}
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? h[key] : ""
}

export function clientMeta(req) {
  const forwarded = String(header(req, "x-forwarded-for") || "")
  const ip = String(header(req, "x-real-ip") || forwarded.split(",")[0] || header(req, "x-vercel-forwarded-for") || "").trim()
  const v4 = ip.includes(":") ? null : ip || null
  const v6 = ip.includes(":") ? ip : null
  return {
    ip: ip || null,
    family: v6 ? "ipv6" : v4 ? "ipv4" : null,
    ipv4: v4,
    ipv6: v6,
    country: header(req, "x-vercel-ip-country") || null,
    region: header(req, "x-vercel-ip-country-region") || null,
    city: header(req, "x-vercel-ip-city") || null,
    latitude: header(req, "x-vercel-ip-latitude") || null,
    longitude: header(req, "x-vercel-ip-longitude") || null,
    timezone: header(req, "x-vercel-ip-timezone") || null,
    postal: header(req, "x-vercel-ip-postal-code") || null,
    as_number: header(req, "x-vercel-ip-as-number") || header(req, "x-vercel-ip-asn") || null,
    edge: header(req, "x-vercel-id") || process.env.VERCEL_REGION || null,
    measured_at: new Date().toISOString(),
  }
}

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader("content-type", "application/json; charset=utf-8")
  res.setHeader("access-control-allow-origin", "*")
  res.setHeader("cache-control", "no-store")
  res.end(JSON.stringify(body, null, 2))
}

export function cors(res) {
  res.setHeader("access-control-allow-origin", "*")
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS")
  res.setHeader("access-control-allow-headers", "content-type,authorization")
  res.setHeader("timing-allow-origin", "*")
}
