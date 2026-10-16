#!/usr/bin/env bash
# vertigo-motion-video — instala as dependências numa pasta de cache (sem mexer no sistema)
# e confere o ambiente: Node, Chromium, ffmpeg com H.264/AAC, fontes e espaço em disco.
set -u
DEPS="$HOME/.cache/vertigo-motion-video/node"
mkdir -p "$DEPS"
ok() { printf '✓ %s\n' "$*"; }
av() { printf '⚠ %s\n' "$*"; }

command -v node >/dev/null || { echo "✗ Node.js não encontrado. Instale o Node 18+ (https://nodejs.org) e rode de novo."; exit 1; }
NV=$(node -p 'process.versions.node.split(".")[0]')
[ "$NV" -ge 18 ] && ok "Node $(node -v)" || { echo "✗ Node $(node -v) é antigo; precisa 18+."; exit 1; }

cd "$DEPS"
[ -f package.json ] || npm init -y >/dev/null 2>&1
if [ ! -d node_modules/playwright ] || [ ! -d node_modules/ffmpeg-static ]; then
  echo "Instalando playwright + ffmpeg-static em $DEPS ..."
  npm i playwright ffmpeg-static --no-audit --no-fund >/dev/null 2>&1 || { echo "✗ npm install falhou (rede/proxy?)."; exit 1; }
fi
ok "pacotes em $DEPS"

# ffmpeg-static baixa o binário num script de pós-instalação; se o npm o bloqueou, roda à mão
FF=$(node -e "console.log(require('$DEPS/node_modules/ffmpeg-static'))")
if [ ! -x "$FF" ]; then (cd node_modules/ffmpeg-static && node install.js >/dev/null 2>&1); fi
if "$FF" -hide_banner -encoders 2>/dev/null | grep -q libx264; then ok "ffmpeg com H.264/AAC"; else echo "✗ ffmpeg sem libx264 ($FF)."; exit 1; fi

npx --yes playwright install chromium >/dev/null 2>&1 || av "não consegui baixar o Chromium do Playwright (rede?)."
if node -e "const {chromium}=require('$DEPS/node_modules/playwright');chromium.launch().then(b=>b.close()).catch(e=>{console.error(e.message);process.exit(1)})" 2>/tmp/vmv-launch.err; then
  ok "Chromium abre"
else
  av "Chromium não abriu. No Linux/WSL faltam bibliotecas: rode  sudo $DEPS/node_modules/.bin/playwright install-deps chromium"
  head -3 /tmp/vmv-launch.err
fi

if command -v fc-list >/dev/null; then
  if fc-list : family | grep -qiE 'helvetica neue'; then ok "fonte Helvetica Neue"
  elif fc-list : family | grep -qiE 'arial|liberation sans'; then ok "fonte reserva (Arial/Liberation Sans) — a identidade usa Helvetica Neue, Arial é o fallback oficial"
  else av "sem Helvetica/Arial/Liberation. Instale fonts-liberation (Linux) para o texto sair com a métrica certa."; fi
fi

if [ -f /proc/version ] && grep -qi microsoft /proc/version && [ -d /mnt/c ]; then
  C=$(df -BM /mnt/c | awk 'NR==2{gsub("M","",$4);print $4}')
  if [ "$C" -lt 1500 ]; then av "WSL: o C: do Windows tem só ${C} MB livres. O disco do WSL é um arquivo no C: e cresce durante o render; o build calcula, antes de cada render, se cabe (um teaser de 30 s pede ~0,5 GB; uma demonstração de 2,5 min, ~1,2 GB por formato)."
  else ok "WSL: C: com ${C} MB livres"; fi
fi
echo "Pronto."
