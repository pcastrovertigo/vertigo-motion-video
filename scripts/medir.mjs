#!/usr/bin/env node
// vertigo-motion-video — mede coordenadas exatas numa captura (para destaques e cliques)
//
//   node medir.mjs <tela.png> info                 largura × altura
//   node medir.mjs <tela.png> linha <y> [x0 x1]    percorre a LINHA horizontal y e lista as bordas (valores de x)
//   node medir.mjs <tela.png> coluna <x> [y0 y1]   percorre a COLUNA vertical x e lista as bordas (valores de y)
//   node medir.mjs <tela.png> caixa <x> <y>        a caixa (borda/fundo) que contém o ponto → [x, y, w, h] e centro
//   node medir.mjs <tela.png> recorte x y w h <saida.png> [zoom]   recorta uma região ampliada para conferir de olho
//
// Estimar coordenadas olhando a imagem erra ~20 px; medir aqui acerta no pixel.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(path.join(os.homedir(), '.cache/vertigo-motion-video/node/package.json'));
const ffmpeg = require('ffmpeg-static');
const [, , img, modo, ...a] = process.argv;
const info = spawnSync(ffmpeg, ['-hide_banner', '-i', img], { encoding: 'utf8' }).stderr.match(/, (\d+)x(\d+)/);
const W = +info[1], H = +info[2];
if (modo === 'info') { console.log(`${W} x ${H}`); process.exit(0); }
if (modo === 'recorte') {
  const [x, y, w, h, out, z = 3] = a;
  spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', img, '-vf', `crop=${w}:${h}:${x}:${y},scale=iw*${z}:-1:flags=neighbor`, out]); console.log('recorte', out); process.exit(0);
}
const raw = spawnSync(ffmpeg, ['-v', 'error', '-i', img, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 }).stdout;
const px = (x, y) => [raw[(y * W + x) * 3], raw[(y * W + x) * 3 + 1], raw[(y * W + x) * 3 + 2]];
const dif = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
const LIM = 25;
const MODO = { 'linha-y': 'linha', 'linha-x': 'coluna' }[modo] || modo; // nomes antigos continuam valendo
if (MODO === 'linha' || MODO === 'coluna') {
  const fix = +a[0], [i0, i1] = a.length > 2 ? [+a[1], +a[2]] : [0, MODO === 'linha' ? W - 1 : H - 1];
  let prev = null, n = 0;
  for (let i = i0; i <= i1; i++) { const c = MODO === 'linha' ? px(i, fix) : px(fix, i); if (prev && dif(c, prev) > LIM) { n++; console.log(`${MODO === 'linha' ? 'x' : 'y'}=${i}  rgb(${prev}) → rgb(${c})`); } prev = c; }
  if (!n) console.log(`nenhuma borda nesse trecho (cor uniforme rgb(${prev})) — tente outra ${MODO === 'linha' ? 'linha (y)' : 'coluna (x)'}, longe de cantos arredondados`);
  process.exit(0);
}
if (modo === 'caixa') {
  const x0 = +a[0], y0 = +a[1], base = px(x0, y0);
  // anda até a cor mudar de vez; letras no meio do caminho (desvio curto que volta à cor de fundo) são atravessadas
  const TXT = +(process.env.MEDIR_TEXTO || 14);
  const dentro = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
  const anda = (dx, dy) => {
    let x = x0, y = y0;
    for (;;) {
      if (!dentro(x + dx, y + dy)) break;
      if (dif(px(x + dx, y + dy), base) <= LIM) { x += dx; y += dy; continue; }
      // borda = linha comprida na direção perpendicular; traço de letra = curto
      const qx = x + dx, qy = y + dy, px2 = dy, py2 = dx; let ext = 1;
      for (const sgn of [1, -1]) for (let j = 1; j < 40; j++) { const ax = qx + px2 * j * sgn, ay = qy + py2 * j * sgn; if (!dentro(ax, ay) || dif(px(ax, ay), base) <= LIM) break; ext++; }
      if (ext >= 20) break;
      let k = 1; while (k <= TXT && dentro(x + dx * (k + 1), y + dy * (k + 1)) && dif(px(x + dx * (k + 1), y + dy * (k + 1)), base) > LIM) k++;
      if (k <= TXT && dentro(x + dx * (k + 1), y + dy * (k + 1))) { x += dx * (k + 1); y += dy * (k + 1); continue; }
      break;
    }
    return dx ? x : y;
  };
  const L = anda(-1, 0), R = anda(1, 0), T = anda(0, -1), B = anda(0, 1);
  console.log(`caixa [${L}, ${T}, ${R - L + 1}, ${B - T + 1}]  centro (${Math.round((L + R) / 2)}, ${Math.round((T + B) / 2)})  cor rgb(${base})`);
  process.exit(0);
}
console.error('modos: info | linha <y> | coluna <x> | caixa <x> <y> | recorte');
