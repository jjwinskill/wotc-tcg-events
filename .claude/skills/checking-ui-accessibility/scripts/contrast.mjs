#!/usr/bin/env node
// WCAG 2.x contrast ratio between colors. Deterministic, so don't eyeball it.
// Usage:
//   node contrast.mjs <fg> <bg>                  one pair, e.g. node contrast.mjs '#ffffff' '#3788d8'
//   node contrast.mjs --pairs pairs.json         [{ "name": "body", "fg": "#..", "bg": "#..", "min": 4.5 }, ...]
// Colors: #rgb, #rrggbb, or #rrggbbaa (alpha is composited over the bg, or over white for the bg itself).
// Exit code 1 if any pair is below its minimum (default 4.5; use 3 for large text and UI components).
import { readFileSync } from 'node:fs';

function parse(hex) {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) throw new Error(`not a hex color: ${hex}`);
  const [r, g, b, a = 255] = h.match(/.{2}/g).map((c) => parseInt(c, 16));
  return { r, g, b, a: a / 255 };
}
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
const channel = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export function ratio(fgHex, bgHex) {
  const bg = over(parse(bgHex), { r: 255, g: 255, b: 255, a: 1 });
  const fg = over(parse(fgHex), bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const argv = process.argv.slice(2);
const pairs = argv[0] === '--pairs'
  ? JSON.parse(readFileSync(argv[1], 'utf8'))
  : [{ name: 'pair', fg: argv[0], bg: argv[1], min: Number(argv[2] ?? 4.5) }];
let failed = 0;
for (const { name, fg, bg, min = 4.5 } of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (min ${min})  ${name}: ${fg} on ${bg}`);
}
process.exit(failed ? 1 : 0);
