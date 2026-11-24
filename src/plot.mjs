/** ANSI sparkline / RTT plot for MCP terminal output. */

const RESET = "\x1b[0m"
const CYAN = "\x1b[36m"
const DIM = "\x1b[2m"
const BOLD = "\x1b[1m"

export function ansiPlot(values, { title = "RTT ms", width = 52, height = 10 } = {}) {
  const xs = (values || []).map(Number).filter((n) => Number.isFinite(n))
  if (!xs.length) return `${DIM}(no samples)${RESET}`
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  const span = hi - lo || 1
  const cols = Math.min(width, Math.max(xs.length, 8))
  const buckets = Array.from({ length: cols }, () => [])
  xs.forEach((v, i) => {
    const c = Math.min(cols - 1, Math.floor((i / xs.length) * cols))
    buckets[c].push(v)
  })
  const med = buckets.map((b) => {
    if (!b.length) return null
    const s = b.slice().sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
  })
  const rows = []
  for (let y = height - 1; y >= 0; y--) {
    const thresh = lo + (span * y) / (height - 1 || 1)
    let line = `${DIM}${String(Math.round(thresh)).padStart(6)}${RESET} │`
    for (let x = 0; x < cols; x++) {
      const v = med[x]
      line += v != null && v >= thresh ? `${CYAN}█${RESET}` : `${DIM}·${RESET}`
    }
    rows.push(line)
  }
  const axis = "       └" + "─".repeat(cols)
  return `${BOLD}${title}${RESET}  min ${lo}  max ${hi}  n ${xs.length}\n${rows.join("\n")}\n${axis}`
}
