import { cors } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  res.setHeader("content-type", "text/plain")
  res.setHeader("alt-svc", 'h3=":443"; ma=86400')
  res.end(".")
}
