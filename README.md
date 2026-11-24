# Graphai MCP

Dummy [MCP](https://modelcontextprotocol.io) named **Graphai**. It talks to a **Vercel webservice** in this same repo for latency, speed, IP, and geolocation, and it wraps the live probes from [check-wireguard.graphai.eu](https://check-wireguard.graphai.eu/).

Clerk login is **shared with [check-wireguard.graphai.eu](https://check-wireguard.graphai.eu/)**. KPI recording and long tools (`stats`, `queries`, `network_quality`, `http2`/`http3`, `video_stream`) need a NOWPayments plan: **whichever is lower of €5 or 0.0001 BTC per month**. `subscribe` prints a terminal QR of the BTC address plus a web invoice link. RTT tools print an ANSI plot.

## Vercel routes

| Path | Purpose |
|---|---|
| `POST /mcp` | MCP JSON-RPC |
| `GET /my-ip` | Public IP seen by the edge |
| `GET /my-ip-geolocation` | IP + country, region, city, lat/lon, timezone, ASN, Vercel region |
| `GET /latency` → `/api/ping` | Tiny RTT target |
| `GET /speed` → `/api/speed?bytes=` | Download blob for Mbps |
| `POST /api/upload` `/api/nq-up` | Uplink |
| `GET /api/nq-ping` `/api/nq-down` | networkQuality idle / download |
| `GET /api/probe` | 256 KiB video-stream proxy |
| `GET /api/ip?fam=ipv4\|ipv6` | Family match |
| `GET /api/stats` | Live request metadata |

## MCP tools (check-wireguard parity)

| Tool | check-wireguard analogue |
|---|---|
| `latency` / `path_sample` | Path sample 1–10 |
| `speed` | Throughput vs `/api/probe` |
| `network_quality` | networkQuality 1–60 |
| `http2` | HTTP/2 1–60 |
| `http3` | HTTP/3 1–60 (`alt-svc` h3) |
| `video_stream` | Video streaming 1–120 |
| `ipv4` / `ipv6` | IPv4 / IPv6 1–10 family check |
| `my_ip` / `my_ip_geolocation` | Request IP and Vercel geo headers |
| `stats` | `/?format=json` / `/api/stats` |
| `check_wg_ip` / `check_wg_stats` | Live proxy to check-wireguard.graphai.eu |
| `queries` | ClickHouse catalog (`by_country`, `scans_recent`, …) — **KPI subscription** |
| `login` / `login_status` / `whoami` | Clerk device ticket → JWT |
| `subscribe` / `subscribe_status` | NOWPayments min(€5, 0.0001 BTC), ANSI QR + web link |

## Deploy

```bash
cd graphai-mcp
npx vercel --prod --yes --scope team_2MzmUHEuxjEOmy13tfYnSTle
```

Production: **https://graphai-mcp.vercel.app**  
MCP: `https://graphai-mcp.vercel.app/mcp`  
GitHub: https://github.com/martibayoalemany9/graphai-mcp

`GRAPHAI_ORIGIN` is set to that URL on Vercel production (stdio clients and self-probes).

## Grok

```toml
[mcp_servers.graphai]
command = "node"
args = ["/Users/username/graphai-mcp/src/stdio.mjs"]
enabled = true

  [mcp_servers.graphai.env]
  GRAPHAI_ORIGIN = "https://YOUR.vercel.app"
```

HTTP after deploy:

```toml
[mcp_servers.graphai]
url = "https://YOUR.vercel.app/mcp"
enabled = true
```

Open a **new Grok chat** after changing `config.toml`. Ask for `latency`, `speed`, `my_ip`, or `my_ip_geolocation` — results are Markdown tables.

## Tests

```bash
node --test src/*.test.mjs
```
