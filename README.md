# vertigo-motion-video

Skill do Claude Code que transforma as telas de um sistema num **vídeo de demonstração em motion
graphics**: a câmera passeia pelas telas reais, anéis destacam o que importa, um cursor clica, a
locução explica e a legenda acompanha palavra por palavra — com trilha no ritmo das animações e a
identidade visual da Vertigo.

**Entrega:** MP4 vertical (1080×1920) e/ou horizontal (1920×1080), versões leves (~30 MB) para
WhatsApp e e-mail, e um HTML de reserva com botão "Baixar MP4".

## Como usar

Peça ao Claude, em linguagem natural:

> Faz um vídeo de demonstração do sistema de contratos, com as telas desta pasta.
>
> Quero um teaser de 30 s do portal para o LinkedIn.
>
> No vídeo que fizemos, troca a fala da cena de aprovação.

A skill conduz o resto. Antes de gerar qualquer coisa, ela pergunta:

| Pergunta | Opções |
|---|---|
| O que mostrar e para quem | texto livre |
| Formato | teaser 30–45 s · demonstração 2–3 min · tutorial de uma funcionalidade |
| Orientação | vertical · horizontal · os dois |
| Telas | capturas prontas · captura automática do site · as duas |
| Estilo | papel bege · Vertigo escuro · claro corporativo · referência anexada |
| Idioma | português · inglês |
| Voz | ElevenLabs pela API · ElevenLabs pelo site · voz do sistema · só legenda |
| Música | trilha sintetizada · arquivo fornecido |
| Marca final | Vertigo · cliente · Vertigo + cliente · nenhuma |
| Pasta de saída | no projeto · pasta específica · pasta Vídeos do sistema |

Com uma **referência visual** anexada, a skill adapta o estilo ao design system da Vertigo (logo
original, azul #076CFE, Helvetica Neue); o que você definir explicitamente vale acima do padrão.

### O fluxo

1. **Perguntas** (acima).
2. **Ambiente** — instala as dependências num cache e confere disco e fontes.
3. **Telas** — usa as capturas fornecidas ou captura o site automaticamente, já corrigindo defeitos
   de renderização. Aponta dados de teste e nomes de pessoas à vista antes de usar.
4. **Roteiro** — cena por cena, com gancho nos 3 primeiros segundos. ✋ *Você aprova.*
5. **Voz** — gera ou recebe a locução; a duração de cada fala define o ritmo.
6. **Montagem** — câmera, destaques e cliques com coordenadas medidas no pixel.
7. **Prévia** — folha de contato com os momentos-chave. ✋ *Você aprova.*
8. **Render e entrega** — MP4, versões leves, HTML e conferência do arquivo final.

Ajustes depois da entrega (um destaque, uma fala, a abertura) re-renderizam só o trecho afetado
quando o tempo do vídeo não muda — minutos em vez de meia hora.

## Instalação

**Claude Code (individual)**

```bash
git clone git@github.com:pcastrovertigo/vertigo-motion-video.git ~/.claude/skills/vertigo-motion-video
```

**Organização no claude.ai** — empacote a pasta como `.skill` (skill-creator:
`python3 -m scripts.package_skill <pasta-da-skill> <destino>`) e um administrador envia o arquivo na
área de Skills das configurações da organização. Se o clone tiver `.git` dentro da pasta, remova-o
do pacote: o empacotador não o exclui.

**Dependências** — na primeira vez, a skill roda `scripts/setup.sh`, que instala Playwright,
Chromium e ffmpeg em `~/.cache/vertigo-motion-video/` (nada é instalado no sistema). Requer
**Node.js 18+**.

| Ambiente | Observações |
|---|---|
| Windows + WSL | O disco do WSL é um arquivo no C: e cresce durante o render (~3× o tamanho do vídeo). O build confere o espaço antes e recusa se não couber. |
| macOS | Funciona direto. Voz do sistema: `say`. |
| Linux | Se o Chromium não abrir: `playwright install-deps chromium`. Fonte: `fonts-liberation`. |
| Claude Code na web | Sem acesso a sites internos: só telas fornecidas. |

## Voz

- **ElevenLabs pela API** — melhor qualidade e legenda exata (alinhamento por letra). A chave fica
  em `~/.config/vertigo-motion-video/elevenlabs.key` (chmod 600), **nunca no chat**. No plano
  gratuito a API não usa vozes da biblioteca (erro 402).
- **ElevenLabs pelo site** — a skill lista as falas; você gera e salva `n00.mp3`, `n01.mp3`…
- **Voz do sistema** — SAPI no Windows, `say` no macOS, `espeak-ng` no Linux.
- **Só legenda** — sem áudio; a duração vem do tempo de leitura.

## Experimente sem gastar nada

`exemplos/modelo/` traz um projeto completo de um sistema fictício ("Contrata+"), com telas de
maquete e sem áudio:

```bash
cd ~/.claude/skills/vertigo-motion-video
bash scripts/setup.sh
node scripts/build.mjs exemplos/modelo/projeto.json linha          # linha do tempo
node scripts/build.mjs exemplos/modelo/projeto.json previa v auto  # folha de contato
node scripts/build.mjs exemplos/modelo/projeto.json mp4 v          # MP4 vertical (~6 min)
```

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `SKILL.md` | Instruções que o Claude segue (o fluxo completo) |
| `assets/motor.html` | O motor: desenha cada quadro a partir de um `projeto.json` via `render(t)` |
| `assets/marca/` | Logos originais da Vertigo (nunca redesenhadas) |
| `scripts/build.mjs` | HTML, linha do tempo, prévias, MP4, trechos, troca de áudio, versões leves, conferência, checagem de disco |
| `scripts/voz.mjs` | Locução (API, voz do sistema, lista de textos, conferência de durações) |
| `scripts/captura.mjs` | Captura de telas a partir de um plano JSON |
| `scripts/medir.mjs` | Mede coordenadas exatas numa captura |
| `scripts/setup.sh` · `pasta-videos.sh` | Ambiente e pasta Vídeos do sistema |
| `references/` | Detalhes por etapa: perguntas, roteiro, projeto, telas, captura, voz, ambiente, ajustes |
| `exemplos/modelo/` | Projeto-modelo "Contrata+" |

## Princípios do estilo

- Logo original, nunca redesenhada; chamada final na tela por pelo menos 2,5 s.
- Algo acontece a cada meio segundo; nenhum corte seco.
- Textos longe das bordas e telas com respiro.
- Os nomes das telas como o cliente os vê, sem tecniquês.
- Nada de credencial no chat ou no projeto.
