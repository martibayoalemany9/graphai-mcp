export const CHECK_WG = "https://check-wireguard.graphai.eu"

export function origin() {
  if (process.env.GRAPHAI_ORIGIN) return String(process.env.GRAPHAI_ORIGIN).replace(/\/$/, "")
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const host = String(process.env.VERCEL_PROJECT_PRODUCTION_URL).replace(/^https?:\/\//, "")
    return `https://${host}`.replace(/\/$/, "")
  }
  return "https://graphai-mcp.vercel.app"
}

export function clamp(n, min, max, fallback) {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, Math.round(v)))
}

export function statsOf(samples) {
  const xs = samples.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!xs.length) return { n: 0, min: null, median: null, max: null }
  const mid = Math.floor(xs.length / 2)
  const median = xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2
  return { n: xs.length, min: xs[0], median, max: xs[xs.length - 1] }
}

export function mdTable(headers, rows) {
  const cell = (v) => String(v ?? "").replace(/\|/g, "\\|")
  const head = `| ${headers.map(cell).join(" | ")} |`
  const sep = `| ${headers.map(() => "---").join(" | ")} |`
  const body = rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n")
  return `${head}\n${sep}\n${body}`
}

export function textResult(markdown) {
  return { content: [{ type: "text", text: markdown }] }
}

export async function getJson(url) {
  const r = await fetch(url, { cache: "no-store" })
  const text = await r.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 500) }
  }
  return { status: r.status, json, ms: null }
}
