/** Compact QR (byte mode, versions 1–6) → ANSI/UTF blocks for the terminal. */

const EC = [
  [1, 10, 7],
  [1, 16, 10],
  [1, 26, 15],
  [1, 36, 20],
  [1, 46, 26],
  [2, 60, 18],
]

function gfMul(a, b) {
  if (!a || !b) return 0
  let p = 0
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a
    const hi = a & 0x80
    a = (a << 1) & 0xff
    if (hi) a ^= 0x1d
    b >>= 1
  }
  return p
}

function rsPoly(ec) {
  let poly = [1]
  let root = 1
  for (let i = 0; i < ec; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root)
      next[j + 1] ^= poly[j]
    }
    poly = next
    let r = root
    root = 0
    for (let k = 0; k < 8; k++) {
      if (r & 1) root ^= 1 << k
      const hi = r & 0x80
      r = (r << 1) & 0xff
      if (hi) r ^= 0x1d
    }
    root = gfMul(2, [1, 2, 4, 8, 16, 32, 64, 128][i] ? root : root) // keep simple generator 2^i
  }
  return poly
}

function reedSolomon(data, ec) {
  const gen = (() => {
    let p = [1]
    let x = 1
    for (let i = 0; i < ec; i++) {
      const n = new Array(p.length + 1).fill(0)
      for (let j = 0; j < p.length; j++) {
        n[j] ^= gfMul(p[j], x)
        n[j + 1] ^= p[j]
      }
      p = n
      x = gfMul(x, 2)
    }
    return p
  })()
  const rest = new Array(ec).fill(0)
  for (const b of data) {
    const f = b ^ rest[0]
    rest.shift()
    rest.push(0)
    if (!f) continue
    for (let i = 0; i < gen.length - 1; i++) rest[i] ^= gfMul(gen[i + 1], f)
  }
  return rest
}

function moduleSize(ver) {
  return 17 + 4 * ver
}

export function qrMatrix(text) {
  const bytes = Array.from(Buffer.from(String(text), "utf8"))
  let ver = 1
  let dataCodewords = 19
  let ec = 7
  for (let v = 1; v <= 6; v++) {
    const [groups, total, ecc] = EC[v - 1]
    const dc = total - ecc * groups
    if (bytes.length + 2 <= dc) {
      ver = v
      dataCodewords = dc
      ec = ecc
      break
    }
  }
  const size = moduleSize(ver)
  const bits = []
  const push = (val, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, 8)
  for (const b of bytes) push(b, 8)
  push(0, 4)
  while (bits.length % 8) bits.push(0)
  const data = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] || 0)
    data.push(b)
  }
  const pad = [0xec, 0x11]
  let p = 0
  while (data.length < dataCodewords) data.push(pad[p++ % 2])
  const ecc = reedSolomon(data.slice(0, dataCodewords), ec)
  const code = data.slice(0, dataCodewords).concat(ecc)
  const grid = Array.from({ length: size }, () => Array(size).fill(null))
  const finder = (r, c) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const rr = r + y
        const cc = c + x
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue
        const on = x === -1 || y === -1 || x === 7 || y === 7
          ? false
          : x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        grid[rr][cc] = on || (x >= 0 && x <= 6 && y >= 0 && y <= 6 && !(x === 1 || x === 5 || y === 1 || y === 5) && !(x >= 2 && x <= 4 && y >= 2 && y <= 4) ? false : on)
        const in7 = x >= 0 && y >= 0 && x <= 6 && y <= 6
        if (in7) {
          const border = x === 0 || y === 0 || x === 6 || y === 6
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
          grid[rr][cc] = border || core
        } else grid[rr][cc] = false
      }
    }
  }
  finder(0, 0)
  finder(0, size - 7)
  finder(size - 7, 0)
  for (let i = 8; i < size - 8; i++) {
    if (grid[6][i] == null) grid[6][i] = i % 2 === 0
    if (grid[i][6] == null) grid[i][6] = i % 2 === 0
  }
  grid[size - 8][8] = true
  let bit = 0
  const totalBits = code.length * 8
  const getBit = (i) => (code[i >> 3] >> (7 - (i & 7))) & 1
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let n = 0; n < size; n++) {
      for (let dx = 0; dx < 2; dx++) {
        const x = col - dx
        const upward = ((size - 1 - col) & 2) === 0
        const y = upward ? size - 1 - n : n
        if (grid[y][x] != null) continue
        let v = bit < totalBits ? getBit(bit) : 0
        if (((x + y) % 2) === 0) v ^= 1
        grid[y][x] = Boolean(v)
        bit++
      }
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (grid[y][x] == null) grid[y][x] = false
  return grid
}

export function qrAnsi(text) {
  const g = qrMatrix(text)
  const quiet = 2
  const size = g.length
  const lines = []
  const on = "██"
  const off = "  "
  for (let y = -quiet; y < size + quiet; y++) {
    let row = ""
    for (let x = -quiet; x < size + quiet; x++) {
      const bit = y >= 0 && x >= 0 && y < size && x < size ? g[y][x] : false
      row += bit ? on : off
    }
    lines.push(row)
  }
  return lines.join("\n")
}
