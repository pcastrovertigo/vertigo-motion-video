#!/usr/bin/env node
// vertigo-motion-video — captura telas de um site a partir de um plano (capturas.json)
//
//   node captura.mjs <capturas.json>                 captura o que ainda não existe
//   node captura.mjs <capturas.json> --id tela-x     só uma (refaz)
//   node captura.mjs <capturas.json> --refazer       refaz todas
//   node captura.mjs <capturas.json> --debug <pasta> registra cada passo e salva a tela quando um passo falha
//
// Formato do plano: ver references/captura.md. Credenciais vêm de variáveis de ambiente ou de um
// arquivo .env indicado no plano — nunca do próprio plano.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(os.homedir(), '.cache/vertigo-motion-video/node/package.json'));
const { chromium } = require('playwright');

const args = process.argv.slice(2), planoArg = args[0];
const opt = n => { const i = args.indexOf('--' + n); return i > -1 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const PLANO_F = path.resolve(planoArg), PD = path.dirname(PLANO_F), PL = JSON.parse(fs.readFileSync(PLANO_F, 'utf8'));
const rel = p => path.isAbsolute(p) ? p : path.join(PD, p);
const SAIDA = rel(PL.saida || 'telas'); fs.mkdirSync(SAIDA, { recursive: true });
const DEBUG = opt('debug'); if (DEBUG) fs.mkdirSync(DEBUG, { recursive: true });
const SESS_DIR = path.join(os.homedir(), '.cache/vertigo-motion-video/sessoes'); fs.mkdirSync(SESS_DIR, { recursive: true });
if (PL.envArquivo && fs.existsSync(rel(PL.envArquivo))) for (const l of fs.readFileSync(rel(PL.envArquivo), 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); }
const host = new URL(PL.base).host;

async function contexto(browser, nome) {
  const base = { viewport: null, ignoreHTTPSErrors: PL.ignorarCertificado !== false };
  const cfg = (PL.sessoes || {})[nome];
  if (!cfg || !cfg.login) return browser.newContext(base);
  const arq = path.join(SESS_DIR, `${host}-${nome}.json`);
  if (fs.existsSync(arq) && !opt('relogar')) return browser.newContext({ ...base, storageState: arq });
  const L = cfg.login, u = process.env[L.envUsuario], s = process.env[L.envSenha];
  if (!u || !s) throw new Error(`faltam ${L.envUsuario}/${L.envSenha} (variáveis de ambiente ou envArquivo)`);
  const ctx = await browser.newContext(base), p = await ctx.newPage();
  await p.goto(PL.base + L.url, { waitUntil: 'domcontentloaded' });
  await p.fill(L.usuario, u); await p.fill(L.senha, s);
  await Promise.all([p.waitForLoadState('networkidle'), p.click(L.entrar)]);
  if (await p.locator(L.senha).count()) throw new Error(`login da sessão "${nome}" não passou`);
  await ctx.storageState({ path: arq }); fs.chmodSync(arq, 0o600); await p.close();
  return ctx;
}

async function passo(p, txt) {
  const [verbo, ...r] = txt.split(':'), alvo = r.join(':');
  const split = (s) => { const i = s.lastIndexOf('='); return [s.slice(0, i), s.slice(i + 1)]; };
  if (verbo === 'esperar') await p.waitForSelector(alvo, { state: 'visible' });
  else if (verbo === 'clicar') await p.click(alvo);
  else if (verbo === 'clicar-se') { const el = p.locator(alvo).first(); if (await el.isVisible({ timeout: 3000 }).catch(() => false)) await el.click(); }
  else if (verbo === 'preencher') { const [s, v] = split(alvo); await p.fill(s, v); }
  else if (verbo === 'selecionar') { const [s, v] = split(alvo); await p.selectOption(s, v); }
  else if (verbo === 'enviar') { const [s, v] = split(alvo); await p.setInputFiles(s, rel(v)); }
  else if (verbo === 'rolar') await p.locator(alvo).first().scrollIntoViewIfNeeded();
  else if (verbo === 'rolar-fim') await p.locator(alvo).first().evaluate(el => { el.scrollTop = el.scrollHeight; });
  else if (verbo === 'esconder') await p.addStyleTag({ content: `${alvo} { visibility: hidden !important; }` });
  else if (verbo === 'pausa') await p.waitForTimeout(Number(alvo));
  else throw new Error(`passo desconhecido: "${txt}"`);
}

// Antes da foto: troca cores translúcidas por opacas equivalentes. O Chromium headless
// (rasterização por software) às vezes desenha um "X" sobre caixas rgba com cantos arredondados.
async function limpa(p, w, h) {
  if (PL.liferay) { const f = p.locator('button.sidenav-close:visible').first(); if (await f.count()) { await f.click(); await p.waitForTimeout(700); } }
  await p.addStyleTag({ content: ['.alert-container', '.lfr-alert-container', '.tooltip', '[role=tooltip]', ...(PL.esconder || [])].join(', ') + ' { display: none !important; }' });
  await p.mouse.move(w - 2, h - 2); await p.evaluate(() => document.activeElement?.blur?.());
  await p.evaluate(() => {
    const rgba = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean); return [+r, +g, +b, +a]; };
    const sobre = (f, b) => f.slice(0, 3).map((v, i) => v * f[3] + b[i] * (1 - f[3]));
    const fundo = el => { const pilha = []; for (let e = el.parentElement; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { pilha.push(c); if (c[3] >= 1) break; } } let b = [255, 255, 255]; for (let i = pilha.length - 1; i >= 0; i--) b = sobre(pilha[i], b); return b; };
    const css = v => `rgb(${v.map(Math.round).join(',')})`;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.borderTopLeftRadius) <= 0 && parseFloat(cs.borderTopRightRadius) <= 0) continue;
      const bg = rgba(cs.backgroundColor), temBg = bg && bg[3] > 0 && bg[3] < 1;
      const lados = ['Top', 'Right', 'Bottom', 'Left'].filter(l => { const c = rgba(cs[`border${l}Color`]); return parseFloat(cs[`border${l}Width`]) > 0 && c && c[3] > 0 && c[3] < 1; });
      if (!temBg && !lados.length) continue;
      const atras = fundo(el), cheio = temBg ? sobre(bg, atras) : (bg && bg[3] >= 1 ? bg : atras);
      if (temBg) el.style.setProperty('background-color', css(cheio), 'important');
      for (const l of lados) el.style.setProperty(`border-${l.toLowerCase()}-color`, css(sobre(rgba(cs[`border${l}Color`]), cheio)), 'important');
    }
  });
}

async function captura(ctx, c) {
  const [w, h] = c.viewport || [1366, 768];
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h });
  await p.goto(PL.base + c.url, { waitUntil: 'networkidle' });
  if (PL.liferay) { const f = p.locator('button.sidenav-close:visible').first(); if (await f.count()) { await f.click(); await p.waitForTimeout(700); } }
  for (const s of c.passos || []) {
    if (DEBUG) console.log('  passo', s);
    try { await passo(p, s); } catch (e) { if (DEBUG) await p.screenshot({ path: path.join(DEBUG, `${c.id}-falha.png`) }); throw e; }
  }
  await limpa(p, w, h);
  await p.waitForTimeout(c.espera ?? 400);
  const out = path.join(SAIDA, `${c.id}.png`);
  if (c.clip) await p.screenshot({ path: out, animations: 'disabled', clip: { x: c.clip[0], y: c.clip[1], width: c.clip[2], height: c.clip[3] } });
  else if (c.recorte) {
    await p.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), c.recorte); await p.waitForTimeout(300);
    const box = await p.locator(c.recorte).first().boundingBox(); if (!box) throw new Error(`recorte "${c.recorte}" não encontrado`);
    // barras fixas no topo (cabeçalho do portal) não podem vazar no recorte
    const topoFixo = await p.evaluate(() => Math.max(0, ...[...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); return (s.position === 'fixed' || s.position === 'sticky') && e.getBoundingClientRect().top <= 0 && e.offsetHeight < 200 && e.offsetWidth > innerWidth * .5; }).map(e => e.getBoundingClientRect().bottom)));
    const m = c.margem || 0, top = Math.max(box.y - m, topoFixo), x = Math.max(0, box.x - m);
    await p.screenshot({ path: out, animations: 'disabled', clip: { x, y: top, width: Math.min(box.width + 2 * m, w - x), height: Math.min(box.y + box.height + m - top, h - top) } });
  } else await p.screenshot({ path: out, animations: 'disabled' });
  await p.close();
  return out;
}

const browser = await chromium.launch({ headless: !opt('visivel') });
const ctxs = new Map(); let falhas = 0;
for (const c of PL.capturas) {
  if (opt('id') && opt('id') !== c.id) continue;
  if (!opt('id') && !opt('refazer') && fs.existsSync(path.join(SAIDA, `${c.id}.png`))) continue;
  try { const s = c.sessao || 'anonimo'; if (!ctxs.has(s)) ctxs.set(s, await contexto(browser, s)); console.log('ok   ', c.id, '→', await captura(ctxs.get(s), c)); }
  catch (e) { falhas++; console.error('FALHA', c.id, '—', e.message.split('\n')[0]); }
}
await browser.close();
if (falhas) { console.error(`${falhas} captura(s) falharam. Dica: --debug <pasta> mostra em que passo parou.`); process.exit(1); }
