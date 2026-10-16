---
name: vertigo-motion-video
description: 'Cria vídeos de demonstração em estilo motion graphics com telas reais de um sistema — locução, legenda palavra por palavra, trilha no ritmo, identidade visual da Vertigo — e entrega MP4 vertical (9:16) e/ou horizontal (16:9) prontos, mais um HTML de reserva com botão "Baixar MP4". Use SEMPRE que alguém pedir vídeo de demonstração, vídeo de produto, teaser, tutorial em vídeo, "vídeo mostrando o sistema X", "vídeo para redes/LinkedIn/apresentação do projeto", motion graphics, vídeo com as telas do sistema, ou quiser transformar capturas de tela ou um site num vídeo explicativo — mesmo que não diga "motion graphics" nem "MP4". Também para ajustar um vídeo já feito por esta skill: trocar uma fala, corrigir um destaque, mudar a abertura, gerar a versão curta.'
---

# vertigo-motion-video

Transforma telas de qualquer sistema num vídeo de demonstração: a câmera passeia pelas telas reais,
anéis destacam o que importa, um cursor clica, a locução explica e a legenda acompanha palavra por
palavra. Tudo é desenhado por uma função `render(t)` num canvas e renderizado quadro a quadro em MP4
— por isso o resultado é exato, reprodutível e editável depois (trocar uma fala não exige refazer tudo).

Um projeto-modelo completo (um sistema fictício de gestão de contratos, o "Contrata+") está em
`exemplos/modelo/projeto.json`. Quando estiver em dúvida sobre como montar algo, olhe como ele foi montado.

## Como a skill está organizada

| Caminho | Para quê |
|---|---|
| `assets/motor.html` | O motor: lê um `projeto.json` e desenha cada quadro. Não edite por vídeo — tudo o que muda entre vídeos vai no projeto. |
| `scripts/setup.sh` | Instala Chromium do Playwright e ffmpeg num cache e confere o ambiente. Rode uma vez por máquina. |
| `scripts/build.mjs` | Monta HTML, prévias, MP4, trechos, troca de áudio, versões leves, checagem de disco. |
| `scripts/voz.mjs` | Locução: ElevenLabs pela API, voz do sistema, ou lista de textos para gerar no site. |
| `scripts/captura.mjs` | Captura telas de um site a partir de um plano, já com as correções de renderização. |
| `scripts/medir.mjs` | Mede coordenadas exatas numa captura (bordas, caixas, centros). |
| `scripts/pasta-videos.sh` | Descobre a pasta Vídeos padrão do sistema. |
| `references/*.md` | Detalhes: perguntas, roteiro, formato do projeto, telas, captura, voz, ambiente, ajustes. |

## O fluxo

O vídeo passa por oito etapas. Há **dois pontos de aprovação** (roteiro e prévia) porque são os
dois momentos em que errar sai caro: depois do roteiro vem a geração de voz, que custa crédito ou
trabalho manual; depois da prévia vem o render, que leva dezenas de minutos.

### 1. Perguntas iniciais — antes de gerar qualquer coisa

Faça as perguntas de `references/perguntas.md`, de preferência com a ferramenta de perguntas de
múltipla escolha, em duas rodadas curtas. Cada resposta muda o que você constrói, então não assuma
padrões em silêncio: se a pessoa já respondeu algo na mensagem, confirme em vez de perguntar de novo.

O mínimo que precisa estar decidido: **o que mostrar e para quem**, **formato** (teaser 30–45 s,
demonstração 2–3 min, tutorial de uma funcionalidade), **orientação** (vertical, horizontal, ambas),
**estilo** (papel bege, Vertigo escuro, claro corporativo, ou referência anexada), **idioma**,
**voz**, **música**, **marca final** e **pasta de saída**.

Se a pessoa anexar uma referência visual, adapte-a ao design system da Vertigo (logo original, azul
#076CFE, Helvetica Neue) — mas o que ela definir explicitamente (uma cor, uma fonte, sem logo) vale
acima do padrão. Ver `references/projeto.md` § Temas.

### 2. Ambiente

Rode `bash scripts/setup.sh` (rápido quando já instalado). Ele avisa sobre bibliotecas faltando,
fonte e — no WSL — espaço no C:. **No WSL o disco Linux é um arquivo dentro do C: do Windows**: o que
se grava "no Linux" também enche o C: (cerca de 3× o tamanho do vídeo). O `build.mjs` faz a conta antes
de renderizar e recusa se não couber; com o C: apertado, avise a pessoa logo e capriche na prévia,
porque um ajuste depois também consome espaço (ver `references/ambiente.md`). No Claude Code na web não há acesso a sites internos: só telas fornecidas.

### 3. Telas

- **Capturas prontas**: peça a pasta. Abra cada imagem para entender o que mostra.
- **Captura automática**: monte um `capturas.json` e rode `scripts/captura.mjs` (ver `references/captura.md`).

Antes de usar uma tela, olhe se há dado de teste à vista ("TESTE", "[TESTE VERTIGO]", "lorem"),
nomes de pessoas reais ou defeitos de renderização (um "X" atravessando botões e selos translúcidos —
bug do Chromium headless, corrigido automaticamente pelo `captura.mjs`). Aponte o que encontrar e
pergunte se pode seguir — num vídeo de vitrine esses detalhes saltam aos olhos. Para esconder um
trecho sem trocar a captura, use `ocultar` na tomada (desfoque). Se não houver a quem perguntar
(execução automática), reduza a exposição — desfoque, sem zoom sobre o trecho, ou outra captura — e
registre a decisão no que você entregar.

### 4. Roteiro — primeiro ponto de aprovação

Escreva o roteiro cena por cena seguindo `references/roteiro.md`: gancho forte nos 3 primeiros
segundos, uma ideia por fala, nomes das telas como o cliente os chama. Mostre como tabela (tempo,
tela, o que acontece, fala) e **espere o ok**. Ao aprovar, grave `narracao/roteiro.json`.

### 5. Voz

Conforme a escolha (detalhes e armadilhas em `references/voz.md`):
- **API ElevenLabs**: `node scripts/voz.mjs <pasta>/narracao api <voice_id> <idioma>`. Gera também o
  alinhamento por letra, que deixa a legenda exata. Vozes da biblioteca exigem plano pago pela API.
- **Site**: `voz.mjs ... textos` lista as falas; a pessoa gera e salva `nNN.mp3` na pasta `narracao/`.
- **Voz do sistema**: `voz.mjs ... sistema <idioma>` (Windows/SAPI, macOS/say, Linux/espeak-ng).
- **Só legenda**: não gere áudio; o motor estima a duração pela leitura. O gancho e o final não mostram
  legenda: o que deve ser lido neles vai nos `textos` do gancho e em `marca.linha`.

Depois, `voz.mjs ... conferir` mostra a duração de cada fala. As durações definem o ritmo do vídeo.

### 6. Montagem do projeto e mapeamento das telas

Escreva o `projeto.json` (formato completo em `references/projeto.md`). Para cada tela, defina a
câmera, os destaques e os cliques — **medindo** as coordenadas com `scripts/medir.mjs`, não estimando
de olho: estimativas erram ~20 px e o anel de destaque sai visivelmente fora do lugar. O procedimento
está em `references/telas.md`.

Rode `node scripts/build.mjs <projeto.json> linha` para ver a linha do tempo resultante.

### 7. Prévia — segundo ponto de aprovação

```bash
node scripts/build.mjs <projeto.json> previa v auto      # meio de cada tomada + transições (e/ou h)
node scripts/build.mjs <projeto.json> previa v 7.5,10    # instantes específicos
```

O comando gera uma **folha de contato** (caminho impresso no fim; fica na pasta de trabalho). O modo
`auto` pega o meio de cada tomada e o instante logo depois de cada destaque, clique e troca de tela —
é ali que aparecem etiquetas cobrindo texto. Na miniatura da folha uma sobreposição passa despercebida:
abra os quadros individuais (impressos na pasta `previas-<fmt>`) dos momentos com destaque — abra-a e confira você mesmo antes de mostrar: texto encostado em borda, destaque fora do
lugar, legenda cobrindo algo importante, tela cortada sem respiro. Corrija o que vir e só então mostre
à pessoa. Espere o ok antes do render.

### 8. Render e entrega

```bash
node scripts/build.mjs <projeto.json> mp4 ambos    # ~8–9 s de render por segundo de vídeo, por formato
node scripts/build.mjs <projeto.json> leve         # versões ~30 MB para WhatsApp/e-mail
node scripts/build.mjs <projeto.json> html         # HTML de reserva com botão Baixar MP4
```

Renders longos: rode em segundo plano e avise a pessoa do tempo estimado. Os quadros vão direto para
o ffmpeg (nada de PNG em disco) — isso importa no WSL. Ao terminar, rode
`build.mjs <projeto.json> conferir v 3,15,28` (decodificação completa, duração, som e quadros extraídos
do MP4 final) e olhe os quadros; depois entregue a lista de arquivos com tamanhos e
uma frase sugerindo que a pessoa assista uma vez com som (você não ouve o resultado).

Ofereça, em uma linha, um texto curto de divulgação no estilo do vídeo (gancho + o que o vídeo mostra).

## Ajustes depois da entrega

Leia `references/ajustes.md`. Em resumo, primeiro descubra se a mudança **mexe no tempo**:
- **Só imagem** (destaque, margem, título do mesmo tamanho): `build.mjs ... trechos v 106.5-114` — minutos.
- **Uma fala trocada**: meça a nova duração; se couber na tomada (reduza `tail` dela), é trecho + `audio`.
  Se não couber, a tomada cresce, tudo depois se desloca e o render é completo.
- **Cortar/reordenar pedaços do MP4**: ffmpeg direto, sem render.

## Princípios que valem para todo vídeo

- **Logo original, nunca redesenhada**: use os arquivos de `assets/marca/`. No tema escuro a capa
  original da Vertigo vira o fundo do final; nos claros, a logo para fundo claro.
- **Algo acontece a cada meio segundo** e **não há corte seco** — o motor já garante (batida de
  0,5 s, transições de luz, zoom, tinta e deslize). Não desligue isso para "simplificar".
- **Textos longe das bordas** e telas com respiro: se uma captura vier recortada rente ao conteúdo,
  dê margem em `projeto.margens`.
- **Nomenclatura do cliente** na fala e nos títulos: use os nomes que aparecem nas telas
  ("Gestão de Contratos", não "módulo de contratos", se a tela diz Gestão de Contratos).
- **Nada de credencial no chat ou no projeto**: chaves e senhas ficam em arquivos protegidos
  (`~/.config/vertigo-motion-video/`) ou variáveis de ambiente.
