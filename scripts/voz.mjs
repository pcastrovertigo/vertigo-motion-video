#!/usr/bin/env node
// vertigo-motion-video — gera a locução de narracao/roteiro.json
//
//   node voz.mjs <pasta-narracao> api <voice_id> [idioma] [ids]   ElevenLabs (chave em ~/.config/vertigo-motion-video/elevenlabs.key)
//   node voz.mjs <pasta-narracao> sistema [idioma] [ids]          voz do sistema (Windows/WSL: SAPI · macOS: say · Linux: espeak-ng)
//   node voz.mjs <pasta-narracao> textos                          imprime as falas numeradas para gerar à mão no site
//   node voz.mjs <pasta-narracao> conferir                        lista o que existe e a duração de cada fala
//
// Só gera as falas que ainda não têm arquivo — exceto as passadas em [ids] (ex.: n01,n20), que são refeitas.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(path.join(os.homedir(), '.cache/vertigo-motion-video/node/package.json'));
const ffmpeg = require('ffmpeg-static');

const [, , dirArg, modo, ...rest] = process.argv;
const DIR = path.resolve(dirArg || '.');
const segs = JSON.parse(fs.readFileSync(path.join(DIR, 'roteiro.json'), 'utf8'));
const tem = id => ['mp3', 'wav', 'm4a'].some(e => fs.existsSync(path.join(DIR, `${id}.${e}`)));
const dur = f => { const m = spawnSync(ffmpeg, ['-hide_banner', '-i', f], { encoding: 'utf8' }).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/); return m ? +m[3] + +m[2] * 60 : 0; };

if (modo === 'textos') { segs.forEach(s => console.log(`${s.id}.mp3  →  ${s.text}`)); process.exit(0); }
if (modo === 'conferir') {
  let tot = 0; for (const s of segs) { const f = ['mp3', 'wav', 'm4a'].map(e => path.join(DIR, `${s.id}.${e}`)).find(fs.existsSync); const d = f ? dur(f) : 0; tot += d; console.log(`${s.id}  ${f ? d.toFixed(2) + ' s' : 'FALTA'}  ${s.text.slice(0, 70)}`); }
  console.log('total', tot.toFixed(1), 's'); process.exit(0);
}

if (modo === 'api') {
  const [voice, idioma = 'pt', only] = rest;
  const kf = path.join(os.homedir(), '.config/vertigo-motion-video/elevenlabs.key');
  if (!fs.existsSync(kf)) { console.error('Sem chave. Grave-a com:\n  mkdir -p ~/.config/vertigo-motion-video && read -s -p "Chave: " K && echo "$K" > ' + kf + ' && chmod 600 ' + kf); process.exit(2); }
  const KEY = fs.readFileSync(kf, 'utf8').trim();
  const pick = only ? only.split(',') : null; let chars = 0;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]; if (pick ? !pick.includes(s.id) : tem(s.id)) continue;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: s.text, model_id: 'eleven_multilingual_v2', language_code: idioma.slice(0, 2), previous_text: segs[i - 1]?.text, next_text: segs[i + 1]?.text,
        voice_settings: { stability: .5, similarity_boost: .8, style: .25, use_speaker_boost: true } }),
    });
    if (!r.ok) {
      const t = await r.text();
      if (r.status === 402) console.error('A ElevenLabs recusou (402): vozes da biblioteca exigem plano pago pela API. Use uma voz padrão, assine o Starter, ou gere no site (modo "textos").');
      console.error('falhou', s.id, r.status, t.slice(0, 300)); process.exit(1);
    }
    const d = await r.json();
    fs.writeFileSync(path.join(DIR, `${s.id}.mp3`), Buffer.from(d.audio_base64, 'base64'));
    fs.writeFileSync(path.join(DIR, `${s.id}.json`), JSON.stringify(d.alignment));   // tempo exato de cada letra → legenda precisa
    chars += s.text.length; console.log('ok', s.id, s.text.slice(0, 60));
  }
  console.log(`${chars} caracteres usados nesta rodada.`); process.exit(0);
}

if (modo === 'sistema') {
  const [idioma = 'pt-BR', only] = rest; const pick = only ? only.split(',') : null;
  const wsl = fs.existsSync('/proc/version') && /microsoft/i.test(fs.readFileSync('/proc/version', 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vmv-voz-'));
  for (const s of segs) {
    if (pick ? !pick.includes(s.id) : tem(s.id)) continue;
    const raw = path.join(tmp, `${s.id}.wav`), out = path.join(DIR, `${s.id}.mp3`);
    if (process.platform === 'darwin') {
      const voz = /^en/i.test(idioma) ? 'Samantha' : 'Luciana';
      spawnSync('say', ['-v', voz, '-o', raw.replace('.wav', '.aiff'), s.text]); spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', raw.replace('.wav', '.aiff'), out]);
    } else if (wsl || process.platform === 'win32') {
      const win = wsl ? spawnSync('wslpath', ['-w', raw], { encoding: 'utf8' }).stdout.trim() : raw;
      const cult = /^en/i.test(idioma) ? 'en-US' : 'pt-BR';
      const ps = `Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $v=$s.GetInstalledVoices()|?{$_.VoiceInfo.Culture.Name -eq '${cult}'}|select -First 1; if($v){$s.SelectVoice($v.VoiceInfo.Name)}; $s.SetOutputToWaveFile('${win}'); $s.Speak('${s.text.replace(/'/g, "''")}'); $s.SetOutputToNull()`;
      spawnSync(wsl ? 'powershell.exe' : 'powershell', ['-NoProfile', '-Command', ps]); spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', raw, out]);
    } else {
      const v = /^en/i.test(idioma) ? 'en' : 'pt-br';
      const r = spawnSync('espeak-ng', ['-v', v, '-w', raw, s.text]); if (r.error) { console.error('espeak-ng não instalado (sudo apt install espeak-ng) — ou use o modo "textos".'); process.exit(2); }
      spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', raw, out]);
    }
    console.log(fs.existsSync(out) ? 'ok' : 'FALHOU', s.id);
  }
  fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0);
}
console.error('modos: api | sistema | textos | conferir'); process.exit(1);
