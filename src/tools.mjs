import { mdTable, origin, textResult } from "./origin.mjs"
import {
  fetchCheckWg,
  fetchIpFamily,
  fetchMyIp,
  fetchMyIpGeo,
  fetchStats,
  measureHttp,
  measureLatency,
  measureNetworkQuality,
  measurePathSample,
  measureSpeed,
  measureVideo,
} from "./probes.mjs"

export const TOOL_DEFS = [
  {
    name: "latency",
    description: "RTT samples (1–10) against the Graphai Vercel /api/ping (same idea as check-wireguard 1–10 path sample).",
    inputSchema: { type: "object", properties: { samples: { type: "integer", minimum: 1, maximum: 10 } } },
  },
  {
    name: "speed",
    description: "Download throughput from Vercel /api/speed (Mbps).",
    inputSchema: { type: "object", properties: { bytes: { type: "integer", minimum: 1024, maximum: 2097152 } } },
  },
  {
    name: "my_ip",
    description: "GET /my-ip on the Graphai Vercel webservice — public IP seen by the edge.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "my_ip_geolocation",
    description: "GET /my-ip-geolocation — IP plus Vercel geo headers (country, city, lat/lon, ASN).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "ipv4",
    description: "IPv4 family check (check-wireguard GET /api/ip?fam=ipv4 equivalent on this host).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "ipv6",
    description: "IPv6 family check (GET /api/ip?fam=ipv6).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "path_sample",
    description: "Path sample 1–10 RTT probes (check-wireguard Sampling the tunnel).",
    inputSchema: { type: "object", properties: { samples: { type: "integer", minimum: 1, maximum: 10 } } },
  },
  {
    name: "network_quality",
    description: "Apple-style networkQuality: idle pings plus download/upload against /api/nq-*.",
    inputSchema: { type: "object", properties: { samples: { type: "integer", minimum: 1, maximum: 60 } } },
  },
  {
    name: "http2",
    description: "HTTP/2 RTT samples 1–60 against Vercel /api/ping.",
    inputSchema: { type: "object", properties: { samples: { type: "integer", minimum: 1, maximum: 60 } } },
  },
  {
    name: "http3",
    description: "HTTP/3-advertised RTT samples 1–60 against /api/nq-ping (alt-svc h3).",
    inputSchema: { type: "object", properties: { samples: { type: "integer", minimum: 1, maximum: 60 } } },
  },
  {
    name: "video_stream",
    description: "Video streaming stall/bitrate proxy 1–120 downloads of /api/probe.",
    inputSchema: { type: "object", properties: { samples: { type: "integer", minimum: 1, maximum: 120 } } },
  },
  {
    name: "stats",
    description: "Live probe JSON like check-wireguard /api/stats for this Graphai origin.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "check_wg_ip",
    description: "Proxy check-wireguard.graphai.eu GET /api/ip.",
    inputSchema: { type: "object", properties: { fam: { type: "string", description: "ipv4 or ipv6" } } },
  },
  {
    name: "check_wg_stats",
    description: "Proxy check-wireguard.graphai.eu GET /api/stats.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "queries",
    description: "Proxy check-wireguard ClickHouse query catalog or a named query (by_country, scans_recent, …).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Query name; omit to list catalog" },
        days: { type: "integer" },
        limit: { type: "integer" },
      },
    },
  },
]

function rttTable(title, data) {
  const rows = (data.samples || []).map((s) => [s.i, s.ms, s.status ?? ""])
  const head = `${title} · origin ${data.origin} · n=${data.n} min=${data.min} median=${data.median} max=${data.max} ms`
  const table = rows.length ? mdTable(["#", "ms", "status"], rows) : "_no samples_"
  return textResult(`${head}\n\n${table}`)
}

export async function callTool(name, args = {}) {
  if (name === "latency" || name === "path_sample") {
    const data = name === "path_sample" ? await measurePathSample(args) : await measureLatency(args)
    return rttTable(name, data)
  }
  if (name === "speed") {
    const d = await measureSpeed(args)
    const table = mdTable(
      ["origin", "bytes", "ms", "mbps", "status"],
      [[d.origin, d.bytes, d.ms, d.mbps != null ? d.mbps.toFixed(3) : "", d.status]],
    )
    return textResult(`speed\n\n${table}`)
  }
  if (name === "my_ip") {
    const d = await fetchMyIp()
    return textResult(`my-ip\n\n${mdTable(["ip", "family", "ipv4", "ipv6"], [[d.ip, d.family, d.ipv4, d.ipv6]])}`)
  }
  if (name === "my_ip_geolocation") {
    const d = await fetchMyIpGeo()
    return textResult(
      `my-ip-geolocation\n\n${mdTable(
        ["ip", "country", "region", "city", "lat", "lon", "tz", "asn", "edge"],
        [[d.ip, d.country, d.region, d.city, d.latitude, d.longitude, d.timezone, d.as_number, d.edge]],
      )}`,
    )
  }
  if (name === "ipv4" || name === "ipv6") {
    const d = await fetchIpFamily(name)
    return textResult(
      `${name}\n\n${mdTable(["ip", "family", "match", "wanted", "edge"], [[d.ip, d.family, d.match, d.wanted, d.edge]])}`,
    )
  }
  if (name === "network_quality") {
    const d = await measureNetworkQuality(args)
    const idle = d.idle
    const table = mdTable(
      ["layer", "min_ms", "median_ms", "max_ms", "mbps"],
      [
        ["idle ping", idle.min, idle.median, idle.max, ""],
        ["download", d.download.ms, "", "", d.download.mbps?.toFixed(3)],
        ["upload", d.upload.ms, "", "", d.upload.mbps?.toFixed(3)],
      ],
    )
    return textResult(`networkQuality · ${d.origin}\n\n${table}`)
  }
  if (name === "http2") return rttTable("http2", await measureHttp({ protocol: "h2", samples: args.samples }))
  if (name === "http3") return rttTable("http3", await measureHttp({ protocol: "h3", samples: args.samples }))
  if (name === "video_stream") {
    const d = await measureVideo(args)
    return textResult(
      `video_stream stalls=${d.stalls} n=${d.n} min=${d.min} median=${d.median} max=${d.max}\n\n${mdTable(
        ["#", "ms"],
        (d.samples || []).map((s) => [s.i, s.ms]),
      )}`,
    )
  }
  if (name === "stats") {
    const d = await fetchStats()
    const c = d.client || {}
    return textResult(
      `stats ${d.service}\n\n${mdTable(["ip", "city", "country", "edge"], [[c.ip, c.city, c.country, c.edge]])}`,
    )
  }
  if (name === "check_wg_ip") {
    const fam = args.fam ? `?fam=${encodeURIComponent(args.fam)}` : ""
    const d = await fetchCheckWg(`/api/ip${fam}`)
    const j = d.json || {}
    return textResult(
      `check-wireguard /api/ip status=${d.status}\n\n${mdTable(["ip", "family", "match", "edge"], [[j.ip, j.family, j.match, j.edge]])}`,
    )
  }
  if (name === "check_wg_stats") {
    const d = await fetchCheckWg("/api/stats")
    const c = d.json?.client || {}
    return textResult(
      `check-wireguard /api/stats\n\n${mdTable(["ip", "city", "isp", "country"], [[c.ip, c.city, c.isp, c.country]])}`,
    )
  }
  if (name === "queries") {
    let path = "/api/queries"
    if (args.name) {
      const q = new URLSearchParams()
      q.set("name", args.name)
      if (args.days) q.set("days", String(args.days))
      if (args.limit) q.set("limit", String(args.limit))
      path = `/api/queries?${q}`
    }
    const d = await fetchCheckWg(path)
    const names = (d.json?.queries || []).map((x) => [x.name, x.href])
    if (names.length) return textResult(`query catalog\n\n${mdTable(["name", "href"], names)}`)
    return textResult(`query ${args.name || "catalog"} status=${d.status}\n\n\`\`\`json\n${JSON.stringify(d.json, null, 2).slice(0, 4000)}\n\`\`\``)
  }
  throw new Error(`unknown tool ${name}`)
}

export function listTools() {
  return TOOL_DEFS
}

export { origin }
