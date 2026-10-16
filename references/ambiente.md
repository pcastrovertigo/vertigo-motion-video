# Ambiente

`bash scripts/setup.sh` instala em `~/.cache/vertigo-motion-video/node` (Playwright + Chromium +
ffmpeg com H.264/AAC) e confere fonte e disco. Nada é instalado no sistema.

| Ambiente | Observações |
|---|---|
| **Windows + WSL** | Ver "O disco do WSL" abaixo. Sites internos: VPN no Windows e, às vezes, MTU 1350 no `eth0`. Voz do sistema via SAPI do Windows. Pasta Vídeos: a do Windows (no C:). |
| **macOS** | Funciona direto. Voz do sistema: `say`. Pasta Vídeos: `~/Movies`. |
| **Linux** | Se o Chromium não abrir: `sudo ~/.cache/vertigo-motion-video/node/node_modules/.bin/playwright install-deps chromium`. Fonte: `fonts-liberation`. |
| **Claude Code na web** | Sem acesso a sites internos nem VPN: só telas fornecidas. O MP4 fica no ambiente remoto — entregue-o pelo mecanismo de arquivos disponível. |

## O disco do WSL (importante)

O disco Linux do WSL é um arquivo virtual (`ext4.vhdx`) **guardado no C: do Windows**. O `df` do
Linux mostra centenas de GB livres, mas cada byte novo gravado "no Linux" pode crescer esse arquivo
no C:. Com o C: cheio, o WSL cai no meio do render.

- O `build.mjs` verifica o C: antes de `mp4`/`trechos` e recusa se não couber — estima o tamanho do
  resultado e, no WSL, reserva **~3×** isso no C: (nos testes, gravar 98 MB fez o disco virtual crescer
  263 MB). Use `--forcar` só se souber o que faz. Com disco curto, capriche na prévia antes do render:
  um ajuste depois (`trechos`) também precisa de espaço.
- O render não grava quadros em disco (vão direto ao ffmpeg). Tamanho do MP4: ~1,6 MB por segundo nos
  temas papel e claro (2,5 min ≈ 230 MB), ~3 MB/s no escuro (30 s ≈ 90 MB); a versão leve fica com
  ~10–15 %. A checagem de disco estima isso e só recusa se não couber. O trabalho temporário fica em
  `~/.cache/vertigo-motion-video/trabalho/<arquivo>`.
- Apagar arquivos no Linux **não devolve** espaço ao C:. Para recuperar: fechar tudo,
  `wsl --shutdown` no PowerShell e compactar (`wsl --manage <distro> --set-sparse true` no WSL
  recente, ou `Optimize-VHD`/`diskpart compact vdisk` como administrador).

## Tempos de referência

Render: ~8–9 s por segundo de vídeo, por formato, nos temas claros (2,5 min ≈ 22 min); ~11 s no escuro. Prévia de ~12
quadros: ~1 min. Trecho de 7 s: ~3 min. Versão leve: ~1 min.
