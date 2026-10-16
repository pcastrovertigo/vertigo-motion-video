#!/usr/bin/env node
// vertigo-motion-video — build do vídeo a partir de um projeto.json
//
//   node build.mjs <projeto.json> html                 monta o HTML (prévia + botão Baixar MP4)
//   node build.mjs <projeto.json> linha                mostra a linha do tempo (tomadas, início, duração)
//   node build.mjs <projeto.json> previa <v|h> 1,5.5,9 quadros-chave + folha de contato ("auto" = meio de cada tomada)
//   node build.mjs <projeto.json> conferir <v|h> [t,...] confere o MP4 pronto: decodifica inteiro, duração, som, quadros
//   node build.mjs <projeto.json> mp4 <v|h|ambos>      render completo (quadros vão direto ao ffmpeg)
//   node build.mjs <projeto.json> trechos <v|h> 10-16,40-45   re-render só desses intervalos (s)
//   node build.mjs <projeto.json> audio <v|h>          troca só a faixa de som do MP4 já pronto
//   node build.mjs <projeto.json> leve                 versões leves (~30 MB) dos MP4 prontos
//   node build.mjs <projeto.json> disco                checa espaço livre (inclui o C: no WSL)
//
// Dependências instaladas por setup.sh em ~/.cache/vertigo-motion-video/node.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPS = path.join(os.homedir(), '.cache/vertigo-motion-video/node');
if (!fs.existsSync(path.join(DEPS, 'node_modules/playwright'))) { console.error('Dependências ausentes. Rode: bash ' + path.join(SKILL, 'scripts/setup.sh')); process.exit(2); }
const require = createRequire(path.join(DEPS, 'package.json'));
const ffmpeg = require('ffmpeg-static');

const [, , projArg, mode = 'html', a3, a4] = process.argv;
if (!projArg) { console.error('uso: node build.mjs <projeto.json> <modo> ...'); process.exit(1); }
const PROJ_FILE = path.resolve(projArg), PDIR = path.dirname(PROJ_FILE);
const P = JSON.parse(fs.readFileSync(PROJ_FILE, 'utf8'));
const rel = p => p && (path.isAbsolute(p) ? p : path.join(PDIR, p));
const NOME = P.arquivo || 'video';
const SAIDA = rel(P.saida || 'saida');
const WORK = rel(P.trabalho) || path.join(os.homedir(), '.cache/vertigo-motion-video/trabalho', NOME);
fs.mkdirSync(SAIDA, { recursive: true }); fs.mkdirSync(WORK, { recursive: true });
const mp4Of = f => path.join(SAIDA, `${NOME}-${f === 'h' ? 'horizontal' : 'vertical'}.mp4`);

// ── disco: no WSL o disco Linux é um arquivo virtual guardado no C: do Windows
function livreMB(p) { try { const s = fs.statfsSync(p); return Math.round(s.bavail * s.bsize / 1048576); } catch { return null; } }
function checaDisco(estMB, forcar) { // estMB = tamanho estimado do que será gravado
  const wsl = fs.existsSync('/proc/version') && /microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'));
  const rows = [['saída', SAIDA, livreMB(SAIDA)], ['trabalho', WORK, livreMB(WORK)]];
  // no WSL, gravar X MB "no Linux" fez o disco virtual crescer ~3X no C: (medido nos testes da skill)
  if (wsl && fs.existsSync('/mnt/c')) rows.push(['C: do Windows (onde mora o disco do WSL)', '/mnt/c', livreMB('/mnt/c'), 3]);
  let ok = true;
  for (const [n, p, mb, fator = 1] of rows) {
    const precisa = Math.round(estMB * fator + 150), baixo = mb != null && mb < precisa;
    console.log(`${baixo ? '⚠' : '✓'} ${n}: ${mb == null ? '?' : mb + ' MB'} livres, precisa ~${precisa} MB (${p})`);
    if (baixo) ok = false;
  }
  if (!ok && !forcar) { console.error('Espaço insuficiente. Libere espaço (ver references/ambiente.md) ou rode com --forcar.'); process.exit(3); }
}
if (mode === 'disco') { checaDisco(300, true); process.exit(0); }
// estimativa do MP4: ~1,6 MB por segundo nos temas claros, ~3 MB/s no escuro (degradê + grão comprimem pior)
const mbPorSeg = () => ((typeof P.tema === 'string' ? P.tema : (P.tema && P.tema.base)) === 'escuro' ? 3 : 1.6);

// ── locução: duração, palavras com tempo (alinhamento da API ou pausas reais do áudio)
function duracao(f) { const m = spawnSync(ffmpeg, ['-hide_banner', '-i', f], { encoding: 'utf8' }).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/); return +m[1] * 3600 + +m[2] * 60 + +m[3]; }
function trechosFalados(f, d) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', f, '-af', 'silencedetect=noise=-38dB:d=0.13', '-f', 'null', '-'], { encoding: 'utf8' });
  const sil = []; let s = null;
  for (const l of r.stderr.split('\n')) { const a = l.match(/silence_start: ([\d.]+)/); if (a) s = +a[1]; const b = l.match(/silence_end: ([\d.]+)/); if (b) { sil.push([s ?? 0, +b[1]]); s = null; } }
  if (s != null) sil.push([s, d]);
  const out = []; let cur = 0; for (const [a, b] of sil) { if (a - cur > .08) out.push([cur, a]); cur = b; } if (d - cur > .08) out.push([cur, d]);
  return out.length ? out : [[0, d]];
}
function espalha(text, chunks) {
  const words = text.split(/\s+/).filter(Boolean), peso = w => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5;
  const frases = []; let cur = [];
  words.forEach((w, i) => { cur.push(i); if (/[,.;:!?]$/.test(w) && i < words.length - 1) { frases.push(cur); cur = []; } }); if (cur.length) frases.push(cur);
  const out = new Array(words.length);
  const spread = (idx, a, b) => { const tot = idx.reduce((s, i) => s + peso(words[i]), 0); let t = a; for (const i of idx) { const d = (b - a) * peso(words[i]) / tot; out[i] = { w: words[i], a: +t.toFixed(3), b: +(t + d).toFixed(3) }; t += d; } };
  if (chunks.length === frases.length) frases.forEach((f, k) => spread(f, chunks[k][0], chunks[k][1]));
  else spread(words.map((_, i) => i), chunks[0][0], chunks[chunks.length - 1][1]);
  return out;
}
function deAlinhamento(text, al) { // alinhamento por caractere (ElevenLabs /with-timestamps)
  const ch = al.characters, st = al.character_start_times_seconds, en = al.character_end_times_seconds, out = []; let w = '', a = null, b = 0;
  ch.forEach((c, i) => { if (/\s/.test(c)) { if (w) out.push({ w, a: +a.toFixed(3), b: +b.toFixed(3) }); w = ''; a = null; } else { if (a == null) a = st[i]; w += c; b = en[i]; } });
  if (w) out.push({ w, a: +a.toFixed(3), b: +b.toFixed(3) });
  return out;
}
function narracao() {
  const dir = rel(P.narracao); const out = {};
  if (!dir || !fs.existsSync(path.join(dir, 'roteiro.json'))) return out;
  for (const s of JSON.parse(fs.readFileSync(path.join(dir, 'roteiro.json'), 'utf8'))) {
    const mp3 = ['mp3', 'wav', 'm4a'].map(e => path.join(dir, `${s.id}.${e}`)).find(f => fs.existsSync(f));
    if (mp3) {
      const d = duracao(mp3), alj = path.join(dir, `${s.id}.json`);
      const words = fs.existsSync(alj) ? deAlinhamento(s.text, JSON.parse(fs.readFileSync(alj, 'utf8'))) : espalha(s.text, trechosFalados(mp3, d));
      out[s.id] = { text: s.text, dur: d, words, audio: fs.readFileSync(mp3).toString('base64') };
    } else { // sem áudio (modo "só legenda"): duração estimada pela leitura
      const n = s.text.split(/\s+/).length, d = Math.max(1.4, n * .38 + .3);
      out[s.id] = { text: s.text, dur: d, words: espalha(s.text, [[0, d - .2]]) };
    }
  }
  return out;
}

// ── HTML: projeto + telas + marca + voz + música embutidos num arquivo só
function montaHTML() {
  const tpl = fs.readFileSync(path.join(SKILL, 'assets/motor.html'), 'utf8');
  const telas = rel(P.telas || 'telas'), assets = {};
  const usadas = new Set();
  const marca = (o) => { if (!o) return; if (Array.isArray(o)) o.forEach(marca); else if (typeof o === 'object') { if (o.img) usadas.add(o.img); if (Array.isArray(o.telas)) o.telas.forEach(t => usadas.add(t)); Object.values(o).forEach(marca); } };
  marca(P.tomadas);
  const achaTela = n => ['png', 'jpg', 'jpeg', 'webp'].map(e => path.join(telas, `${n}.${e}`)).find(f => fs.existsSync(f));
  const mime = f => ({ jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp' }[path.extname(f).slice(1).toLowerCase()] || 'png');
  const falta = [];
  for (const n of usadas) { const f = achaTela(n); if (!f) { falta.push(n); continue; } assets[n] = `data:image/${mime(f)};base64,` + fs.readFileSync(f).toString('base64'); }
  if (falta.length) { console.error('Telas não encontradas em ' + telas + ': ' + falta.join(', ')); process.exit(4); }
  const M = P.marca || { vertigo: true };
  if (M.vertigo !== false) {
    assets['vertigo-logo'] = 'data:image/png;base64,' + fs.readFileSync(path.join(SKILL, 'assets/marca/vertigo-logo-fundo-claro.png')).toString('base64');
    assets['vertigo-capa'] = 'data:image/png;base64,' + fs.readFileSync(path.join(SKILL, 'assets/marca/vertigo-capa-escura.png')).toString('base64');
  }
  if (M.cliente && M.cliente.logo) { const f = rel(M.cliente.logo); assets['cliente-logo'] = `data:image/${mime(f)};base64,` + fs.readFileSync(f).toString('base64'); }
  const narr = narracao();
  const faltaVoz = (P.tomadas || []).flatMap(t => t.seg || []).filter(id => !narr[id]);
  if (faltaVoz.length) { console.error('Falas sem texto no roteiro.json: ' + faltaVoz.join(', ')); process.exit(5); }
  const mus = P.musica && P.musica.tipo === 'arquivo' && P.musica.arquivo ? fs.readFileSync(rel(P.musica.arquivo)).toString('base64') : null;
  fs.writeFileSync(path.join(WORK, 'tempos-palavras.json'), JSON.stringify(Object.fromEntries(Object.entries(narr).map(([k, v]) => [k, { dur: v.dur, words: v.words, audio: !!v.audio }])), null, 1));
  const html = tpl.replace('__TITULO__', (P.titulo || 'Vídeo').replace(/</g, '')).replace('__PROJETO__', JSON.stringify(P)).replace('__ASSETS__', JSON.stringify(assets))
    .replace('__NARR__', JSON.stringify(narr)).replace('__MUSICA__', mus ? JSON.stringify(mus) : 'null');
  const out = path.join(WORK, `${NOME}.html`); fs.writeFileSync(out, html);
  return out;
}
const HTML = montaHTML();
if (mode === 'html') { const dst = path.join(SAIDA, `${NOME}.html`); fs.copyFileSync(HTML, dst); console.log('html', dst, (fs.statSync(dst).size / 1e6).toFixed(1), 'MB'); process.exit(0); }
if (mode === 'leve') {
  for (const f of ['v', 'h']) { const src = mp4Of(f); if (!fs.existsSync(src)) continue; const dst = src.replace('.mp4', '-leve.mp4');
    spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', dst], { stdio: 'inherit' });
    console.log('leve', dst, (fs.statSync(dst).size / 1e6).toFixed(0), 'MB'); }
  process.exit(0);
}

// ── navegador
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on('pageerror', e => console.log('[erro na página]', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
await page.addInitScript(() => { window.NO_AUTO_AUDIO = true; });
async function abre(fmt) { await page.goto('file://' + HTML + '?formato=' + fmt); return page.evaluate(() => window.ready); }
const frame = async (t, i) => Buffer.from(await page.evaluate(([t, i]) => { window.render(t, i); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, [t, i]), 'base64');
const encArgs = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-profile:v', 'high', '-tune', 'stillimage', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
async function wav() { const p = path.join(WORK, 'trilha.wav'); fs.writeFileSync(p, Buffer.from(await page.evaluate(async () => window.wavBase64(await window.renderAudio())), 'base64')); return p; }
const fim = async c => { await browser.close(); process.exit(c); };

if (mode === 'linha') { const D = await abre('v'); console.log(JSON.stringify(await page.evaluate(() => window.TIMELINE_INFO()), null, 0)); console.log('duração total', D.toFixed(2), 's'); await fim(0); }

if (mode === 'previa') {
  const fmt = a3 || 'v', D = await abre(fmt);
  let ts = (a4 || '').split(',').filter(Boolean).map(Number);
  if (!a4 || a4 === 'auto') { // meio de cada tomada + o meio de algumas transições
    const tl = await page.evaluate(() => window.TIMELINE_INFO());
    ts = tl.map(s => +(s.t0 + s.d * .55).toFixed(2));
    tl.forEach(s => (s.momentos || []).forEach(m => ts.push(+m.toFixed(2))));   // 0,6 s depois de cada destaque/clique/troca
    tl.filter((s, i) => i && tl[i - 1].ch !== s.ch).slice(0, 3).forEach(s => ts.push(+(s.t0).toFixed(2)));
    ts = [...new Set(ts)].sort((x, y) => x - y).filter((t, i, a) => !i || t - a[i - 1] > .4);
  }
  const dir = path.join(WORK, `previas-${fmt}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const t of ts) fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(7, '0')}.png`), await frame(Math.min(t, D - .01), Math.round(t * 30)));
  const cols = Math.min(fmt === 'h' ? 3 : 6, ts.length), rows = Math.ceil(ts.length / cols), sc = fmt === 'h' ? 'scale=640:360' : 'scale=300:533';
  const folha = path.join(WORK, `folha-${fmt}.png`);
  spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(dir, 't*.png'), '-vf', `${sc},tile=${cols}x${rows}:padding=6:color=gray`, '-frames:v', '1', folha]);
  console.log('quadros em', dir); console.log('folha de contato', folha, '| duração total', D.toFixed(2), 's');
  await fim(0);
}

if (mode === 'mp4') {
  const fmts = (a3 === 'ambos' || !a3) ? (P.formatos || ['v', 'h']) : [a3];
  { const D0 = await abre(fmts[0]); checaDisco(Math.round(D0 * mbPorSeg() * fmts.length + 30), process.argv.includes('--forcar')); }
  for (const fmt of fmts) {
    const t0 = Date.now(), D = await abre(fmt), w = await wav(), out = mp4Of(fmt);
    const ff = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-i', w,
      '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', ...encArgs, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const N = Math.round(D * 30);
    for (let i = 0; i < N; i++) { const b = await frame(i / 30, i); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 450 === 0) console.log(`${fmt}: quadro ${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); fs.rmSync(w, { force: true });
    console.log('mp4', out, (fs.statSync(out).size / 1e6).toFixed(0), 'MB', ((Date.now() - t0) / 1000).toFixed(0), 's');
  }
  await fim(0);
}

if (mode === 'trechos' || mode === 'audio') {
  const fmt = a3 || 'v', base = mp4Of(fmt);
  if (!fs.existsSync(base)) { console.error('MP4 base não existe: ' + base); await fim(1); }
  const baseMB = fs.statSync(base).size / 1048576;
  checaDisco(Math.round(baseMB * 1.2), process.argv.includes('--forcar'));
  // cópia de segurança da versão atual, se houver espaço (o ajuste recodifica o arquivo inteiro)
  const anterior = base.replace('.mp4', '.anterior.mp4'), livre = livreMB(SAIDA);
  if (livre == null || livre > baseMB * 3 + 300) { fs.copyFileSync(base, anterior); console.log('cópia de segurança', anterior); }
  else console.log('⚠ sem espaço para cópia de segurança; seguindo sem ela');
  await abre(fmt); const w = await wav();
  const inputs = [], filters = []; let last = '0:v';
  const ranges = mode === 'trechos' ? (a4 || '').split(',').filter(Boolean).map(r => r.split('-').map(Number)) : [];
  for (const [k, [a, b]] of ranges.entries()) {
    const f0 = Math.round(a * 30), f1 = Math.round(b * 30), seg = path.join(WORK, `trecho-${fmt}-${k}.mp4`);
    const enc = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '6', '-pix_fmt', 'yuv444p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = f0; i < f1; i++) { const b2 = await frame(i / 30, i); if (!enc.stdin.write(b2)) await new Promise(r => enc.stdin.once('drain', r)); }
    enc.stdin.end(); await new Promise(r => enc.on('close', r));
    inputs.push('-itsoffset', String(f0 / 30), '-i', seg);
    filters.push(`[${last}][${k + 2}:v]overlay=eof_action=pass:enable='between(t,${(f0 / 30).toFixed(4)},${((f1 - 1) / 30).toFixed(4)})'[v${k}]`); last = `v${k}`;
    console.log('trecho', a, b, f1 - f0, 'quadros');
  }
  const tmp = base.replace('.mp4', '.novo.mp4');
  const video = ranges.length ? ['-filter_complex', filters.join(';') + `;[${last}]scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[vo]`, '-map', '[vo]', ...encArgs] : ['-map', '0:v', '-c:v', 'copy'];
  const r = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', base, '-i', w, ...inputs, ...video, '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', tmp], { stdio: 'inherit' });
  ranges.forEach((_, k) => fs.rmSync(path.join(WORK, `trecho-${fmt}-${k}.mp4`), { force: true })); fs.rmSync(w, { force: true });
  if (r.status) { console.error('falhou ao montar'); await fim(1); }
  fs.renameSync(tmp, base); console.log('mp4 atualizado', base);
  await fim(0);
}
if (mode === 'conferir') {
  const fmt = a3 || 'v', f = mp4Of(fmt);
  if (!fs.existsSync(f)) { console.error('não existe: ' + f); await fim(1); }
  const info = spawnSync(ffmpeg, ['-hide_banner', '-i', f], { encoding: 'utf8' }).stderr;
  const d = info.match(/Duration: (\d+):(\d+):([\d.]+)/), dur = +d[1] * 3600 + +d[2] * 60 + +d[3];
  const dec = spawnSync(ffmpeg, ['-v', 'error', '-i', f, '-f', 'null', '-'], { encoding: 'utf8' }).stderr.trim();
  const vol = spawnSync(ffmpeg, ['-hide_banner', '-i', f, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr.match(/max_volume: ([-\d.]+) dB/);
  const res = (info.match(/, (\d{3,4}x\d{3,4})/) || [])[1];
  console.log(`${path.basename(f)}: ${res}, ${dur.toFixed(2)} s, ${(fs.statSync(f).size / 1e6).toFixed(0)} MB, som ${/Audio:/.test(info) ? 'sim' : 'NÃO'}${vol ? ` (pico ${vol[1]} dB)` : ''}, decodificação ${dec ? 'COM ERROS: ' + dec.slice(0, 200) : 'ok'}`);
  const ts = (a4 || '').split(',').filter(Boolean).map(Number), dir = path.join(WORK, `conferir-${fmt}`);
  if (ts.length) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (const t of ts) spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(t), '-i', f, '-frames:v', '1', path.join(dir, `t${t.toFixed(2).padStart(7, '0')}.png`)]);
    console.log('quadros extraídos do MP4 em', dir); }
  await fim(0);
}
console.error('modo desconhecido: ' + mode); await fim(1);
