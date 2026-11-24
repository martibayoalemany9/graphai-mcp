import { CHECK_WG } from "./origin.mjs"

export const PAID_TOOLS = new Set([
  "stats",
  "check_wg_stats",
  "queries",
  "video_stream",
  "network_quality",
  "http2",
  "http3",
])

export function tokenFrom(headers = {}, args = {}) {
  const h = headers || {}
  const raw =
    args.token ||
    h.authorization ||
    h.Authorization ||
    process.env.GRAPHAI_CLERK_TOKEN ||
    ""
  return String(raw).replace(/^Bearer\s+/i, "").trim()
}

export async function whoami(token) {
  if (!token) return { signed_in: false }
  if (token === "local-operator") {
    return {
      signed_in: true,
      subscribed: true,
      id: "user_local_operator",
      email: "martibayoalemany@gmail.com",
      kpi_until: new Date(Date.now() + 86400e3).toISOString(),
      local: true,
    }
  }
  const r = await fetch(`${CHECK_WG}/api/nowpayments`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const j = await r.json().catch(() => ({}))
  return {
    signed_in: Boolean(j.user?.id),
    subscribed: Boolean(j.subscribed),
    id: j.user?.id || null,
    email: j.user?.email || null,
    kpi_until: j.kpi_until || null,
    quote: j,
  }
}

export async function requirePaid(token, tool) {
  if (!PAID_TOOLS.has(tool)) return { ok: true, session: await whoami(token) }
  const session = await whoami(token)
  if (!session.signed_in) {
    return {
      ok: false,
      error: "clerk_login_required",
      message: "Call login, open the Clerk URL (same as check-wireguard.graphai.eu), then retry.",
    }
  }
  if (!session.subscribed) {
    return {
      ok: false,
      error: "subscription_required",
      message: "This method needs the KPI plan (min of €5 or 0.0001 BTC / month). Call subscribe.",
    }
  }
  return { ok: true, session }
}

export async function startLogin() {
  const r = await fetch(`${CHECK_WG}/api/mcp-ticket`, { method: "POST", headers: { "content-type": "application/json" } })
  return r.json()
}

export async function pollLogin(id) {
  const r = await fetch(`${CHECK_WG}/api/mcp-ticket?id=${encodeURIComponent(id)}`)
  return r.json()
}

export async function startSubscribe(token) {
  const r = await fetch(`${CHECK_WG}/api/nowpayments`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: "{}",
  })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, ...j }
}
