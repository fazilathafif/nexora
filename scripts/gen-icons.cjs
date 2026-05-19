#!/usr/bin/env node
/**
 * Generates PWA icons as valid PNG files using only Node built-ins.
 * Outputs: public/icons/icon-192.png, icon-512.png, public/apple-touch-icon.png
 */
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

// ── CRC32 (required by PNG spec) ─────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function pngChunk(type, data) {
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf  = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

// ── Icon drawing ──────────────────────────────────────────────────────────────
// Returns RGBA pixel array for a Nexora-branded icon at given size.
// Design: teal radial-gradient bg, white rounded N / star glyph.
function drawIcon(size) {
  // Background gradient: deep teal centre → darker edge
  const BG_CENTER  = [15, 118, 110]   // #0F766E
  const BG_EDGE    = [7,  59,  55]    // #073B37
  const FG         = [255, 255, 255]  // white glyph

  const cx = size / 2, cy = size / 2
  const maxR = size * 0.5

  // RGBA flat array
  const data = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i   = (y * size + x) * 4
      const dx  = x - cx, dy = y - cy
      const d   = Math.sqrt(dx*dx + dy*dy)

      // Rounded square mask (superellipse r=4)
      const nx  = Math.abs(dx) / (size * 0.48)
      const ny  = Math.abs(dy) / (size * 0.48)
      const se  = Math.pow(nx, 4) + Math.pow(ny, 4)
      if (se > 1) { data[i+3] = 0; continue }   // transparent corner

      // Background gradient
      const t = Math.min(d / maxR, 1)
      const bg = BG_CENTER.map((c, j) => Math.round(c + (BG_EDGE[j] - c) * t))

      // Glyph: a bold "✦" diamond-star
      // Built from 4 diamond petals
      const adx  = Math.abs(dx / (size * 0.28))
      const ady  = Math.abs(dy / (size * 0.28))
      const glyph =
        (adx + ady < 1.0) ||                               // main diamond
        (adx < 0.18 && ady < 0.55) ||                      // vertical bar
        (adx < 0.55 && ady < 0.18)                         // horizontal bar

      if (glyph) {
        data[i]   = FG[0]; data[i+1] = FG[1]; data[i+2] = FG[2]
      } else {
        data[i]   = bg[0]; data[i+1] = bg[1]; data[i+2] = bg[2]
      }
      data[i+3] = 255
    }
  }
  return data
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
function encodePNG(size, rgba) {
  // Convert RGBA → RGB scanlines with filter byte 0 (None)
  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * (1 + size * 3) + 1 + x * 3
      raw[dst]   = rgba[src]
      raw[dst+1] = rgba[src+1]
      raw[dst+2] = rgba[src+2]
    }
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB

  const idat = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Write files ───────────────────────────────────────────────────────────────
const OUT = path.join(__dirname, '..', 'public')

for (const size of [192, 512]) {
  const dest = path.join(OUT, 'icons', `icon-${size}.png`)
  fs.writeFileSync(dest, encodePNG(size, drawIcon(size)))
  console.log('wrote', dest)
}

const touch = path.join(OUT, 'apple-touch-icon.png')
fs.writeFileSync(touch, encodePNG(180, drawIcon(180)))
console.log('wrote', touch)

console.log('Done.')
