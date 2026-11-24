import { cors, json } from "../lib/client-meta.js"

export default async function handler(req, res) {
  cors(res)
  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }
  let n = 0
  for await (const c of req) n += c.length
  json(res, 200, { object: "upload", bytes: n })
}
