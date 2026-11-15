// Joonistab äpi ikooni (tomatipunane taust, valge kauss, rohelised lehed) ja salvestab PNG-failid kausta icons/.
// Käivita: node tools/make-icons.js
const fs = require("fs"), path = require("path"), zlib = require("zlib");

const RED = [217, 61, 35], WHITE = [255, 255, 255], GREEN = [63, 163, 77], GREEN2 = [108, 203, 120], SHADOW = [190, 48, 28];

// Kas punkt (x,y) vahemikus 0..1 kuulub kujundisse; tagastab värvi või null (taust)
function inEllipse(x, y, cx, cy, rx, ry, rot) {
  const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dy = y - cy;
  const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
  return u * u + v * v <= 1;
}
function shade(x, y) {
  // kauss: alumine poolring + serv
  const bx = 0.5, by = 0.54, br = 0.30;
  const inBowl = y >= by && (x - bx) ** 2 + (y - by) ** 2 <= br * br;
  const inRim = y >= by - 0.035 && y <= by + 0.005 && Math.abs(x - bx) <= br + 0.03;
  // kausi vari taustal
  if (!inBowl && !inRim && y >= by + 0.02 && (x - bx - 0.02) ** 2 + (y - by - 0.02) ** 2 <= br * br) return SHADOW;
  // lehed kausi kohal
  if (inEllipse(x, y, 0.57, 0.36, 0.13, 0.065, -0.75)) return GREEN;
  if (inEllipse(x, y, 0.42, 0.40, 0.10, 0.05, 0.6)) return GREEN2;
  // tomat kausis
  const td = (x - 0.36) ** 2 + (y - 0.47) ** 2;
  if (td <= 0.072 ** 2) return [255, 112, 80];   // tomat
  if (td <= 0.088 ** 2) return WHITE;            // valge serv, et tomat taustast eristuks
  if (inBowl || inRim) return WHITE;
  return RED;
}

function render(size) {
  const S = 4, px = Buffer.alloc(size * (size * 3 + 1));
  for (let j = 0; j < size; j++) {
    px[j * (size * 3 + 1)] = 0; // PNG rea filter: none
    for (let i = 0; i < size; i++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const c = shade((i + (sx + 0.5) / S) / size, (j + (sy + 0.5) / S) / size);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = j * (size * 3 + 1) + 1 + i * 3, n = S * S;
      px[o] = Math.round(r / n); px[o + 1] = Math.round(g / n); px[o + 2] = Math.round(b / n);
    }
  }
  return png(size, size, px);
}

// ---- minimaalne PNG kodeerija ----
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; // 8 bit RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const out = path.join(__dirname, "..", "icons");
fs.mkdirSync(out, { recursive: true });
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  fs.writeFileSync(path.join(out, name), render(size));
  console.log("icons/" + name, size + "×" + size);
}
