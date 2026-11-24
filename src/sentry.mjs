export async function captureException(err) {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  try {
    const Sentry = await import("@sentry/node")
    if (!globalThis.__graphaiMcpSentry) {
      Sentry.init({ dsn, tracesSampleRate: 0.05, environment: process.env.VERCEL_ENV || "production" })
      globalThis.__graphaiMcpSentry = true
    }
    Sentry.captureException(err)
  } catch {
    /* optional */
  }
}
