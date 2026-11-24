import { cors } from "../lib/client-meta.js"

export default function handler(req, res) {
  cors(res)
  res.setHeader("content-type", "text/plain; charset=utf-8")
  res.setHeader("alt-svc", 'h3=":443"; ma=86400')
  res.end(".")
}
