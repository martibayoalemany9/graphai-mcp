import { CHECK_WG, clamp, origin, statsOf } from "./origin.mjs"

async function timedGet(url) {
  const t0 = Date.now()
  const r = await fetch(url, { cache: "no-store" })
  const buf = Buffer.from(await r.arrayBuffer())
  return { ms: Date.now() - t0, status: r.status, bytes: buf.length, proto: r.headers.get("alt-svc") || "" }
}

async function timedPost(url, bytes) {
  const body = Buffer.alloc(bytes, 0x62)
  const t0 = Date.now()
  const r = await fetch(url, { method: "POST", body, cache: "no-store" })
  await r.arrayBuffer()
  return { ms: Date.now() - t0, status: r.status, bytes }
}

export async function measureLatency({ samples = 10, path = "/api/ping" } = {}) {
  const n = clamp(samples, 1, 10, 10)
  const base = origin()
  const times = []
  for (let i = 0; i < n; i++) {
    const { ms, status } = await timedGet(`${base}${path}`)
    times.push({ i: i + 1, ms, status })
  }
  return { origin: base, path, ...statsOf(times.map((t) => t.ms)), samples: times }
}

export async function measureSpeed({ bytes = 262144 } = {}) {
  const n = clamp(bytes, 1024, 2 * 1024 * 1024, 262144)
  const base = origin()
  const { ms, status, bytes: got } = await timedGet(`${base}/api/speed?bytes=${n}`)
  const mbps = ms > 0 ? (got * 8) / (ms / 1000) / 1e6 : null
  return { origin: base, bytes: got, ms, status, mbps }
}

export async function measurePathSample({ samples = 10 } = {}) {
  return measureLatency({ samples, path: "/api/ping" })
}

export async function measureNetworkQuality({ samples = 10 } = {}) {
  const n = clamp(samples, 1, 60, 10)
  const base = origin()
  const idle = []
  for (let i = 0; i < Math.min(n, 10); i++) {
    idle.push((await timedGet(`${base}/api/nq-ping`)).ms)
  }
  const down = await timedGet(`${base}/api/nq-down`)
  const up = await timedPost(`${base}/api/nq-up`, 64 * 1024)
  const downMbps = down.ms > 0 ? (down.bytes * 8) / (down.ms / 1000) / 1e6 : null
  const upMbps = up.ms > 0 ? (up.bytes * 8) / (up.ms / 1000) / 1e6 : null
  return {
    origin: base,
    idle: statsOf(idle),
    download: { ...down, mbps: downMbps },
    upload: { ...up, mbps: upMbps },
  }
}

export async function measureHttp({ protocol = "h2", samples = 10 } = {}) {
  const n = clamp(samples, 1, 60, 10)
  const path = protocol === "h3" ? "/api/nq-ping" : "/api/ping"
  const r = await measureLatency({ samples: n, path })
  return { protocol, ...r }
}

export async function measureVideo({ samples = 10 } = {}) {
  const n = clamp(samples, 1, 120, 10)
  const base = origin()
  const times = []
  let stalls = 0
  for (let i = 0; i < n; i++) {
    const hit = await timedGet(`${base}/api/probe`)
    times.push(hit.ms)
    if (hit.ms > 800) stalls += 1
  }
  return { origin: base, stalls, ...statsOf(times), samples: times.map((ms, i) => ({ i: i + 1, ms })) }
}

export async function fetchMyIp() {
  const r = await fetch(`${origin()}/my-ip`, { cache: "no-store" })
  return r.json()
}

export async function fetchMyIpGeo() {
  const r = await fetch(`${origin()}/my-ip-geolocation`, { cache: "no-store" })
  return r.json()
}

export async function fetchIpFamily(fam) {
  const r = await fetch(`${origin()}/api/ip?fam=${encodeURIComponent(fam)}`, { cache: "no-store" })
  return r.json()
}

export async function fetchStats() {
  const r = await fetch(`${origin()}/api/stats`, { cache: "no-store" })
  return r.json()
}

export async function fetchCheckWg(path, token = "") {
  const headers = {}
  if (token) headers.authorization = `Bearer ${token}`
  const r = await fetch(`${CHECK_WG}${path}`, { headers, cache: "no-store" })
  const text = await r.text()
  try {
    return { status: r.status, json: JSON.parse(text) }
  } catch {
    return { status: r.status, json: { text: text.slice(0, 800) } }
  }
}
