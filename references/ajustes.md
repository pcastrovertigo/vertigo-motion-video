# Ajustes depois da entrega

A pergunta que decide o custo: **a mudança altera a duração de alguma tomada?** Tudo depois de uma
tomada que cresce se desloca, e aí não há atalho.

## 1. Só imagem (tempo igual) — minutos

Destaque fora do lugar, margem, cor, título com o mesmo comprimento, trocar uma captura.

```bash
node scripts/build.mjs projeto.json linha                 # ache t0 e d da tomada
node scripts/build.mjs projeto.json previa h 107.5,110    # confira a correção
node scripts/build.mjs projeto.json trechos h 106.5-114   # [t0 − 0,5, t0 + d + 0,5] cobre as transições
node scripts/build.mjs projeto.json trechos v 106.5-114
node scripts/build.mjs projeto.json leve
```

## 2. Uma fala trocada

1. Atualize o texto em `narracao/roteiro.json` (a legenda sai daqui) e o áudio `nNN.mp3`.
2. `node scripts/voz.mjs narracao conferir` → nova duração.
3. `node scripts/build.mjs projeto.json linha` → a duração total mudou?
   - **Não mudou**: `trechos` na tomada + a faixa de som nova vem junto (o modo `trechos` sempre
     remonta o áudio inteiro). Se só o som mudou, `audio <fmt>`.
   - **Mudou por pouco** (até ~0,3 s): reduza o `tail` daquela tomada (ex.: 0,55 → 0,4) e confira de novo.
     A fala costuma ter silêncio no fim, então cabe.
   - **Mudou mais**: render completo (`mp4 ambos`). Ajuste antes o que dependia de tempos fixos da
     tomada (no gancho: `voiceAt`, `selo.em`, `etiquetaEm`) olhando `tempos-palavras.json`.

## 3. Mudar a abertura ou o gancho

Quase sempre muda a duração → render completo. Sincronize os efeitos com a fala nova: abra
`<trabalho>/tempos-palavras.json`, ache a palavra (ex.: "publicada" em 2,63 s da fala n01, que começa
em 3,3 s no gancho) e ponha `selo.em = 3,3 + 2,63 ≈ 5,9`.

## 4. Cortar, reordenar, encurtar

Para tirar um pedaço sem mudar mais nada, corte o MP4 com ffmpeg (recodificando nos pontos de corte).
Para uma versão curta (teaser) a partir de uma demonstração: novo `projeto.json` reaproveitando as
mesmas telas e falas selecionadas — o render é rápido porque o vídeo é curto.

## Conferir sempre

```bash
node scripts/build.mjs projeto.json conferir v 10.5,11.4   # decodifica inteiro, duração, som, e extrai quadros do MP4
```
O ffmpeg da skill não fica no PATH; use sempre o `conferir` (ou o binário em
`~/.cache/vertigo-motion-video/node/node_modules/ffmpeg-static/ffmpeg`).

O modo `trechos` guarda a versão anterior em `<arquivo>-<formato>.anterior.mp4` quando há espaço, e
recodifica o arquivo inteiro (perda mínima, imperceptível; evite dezenas de ajustes encadeados — depois
de muitos, faça um render completo). Apague o `.anterior.mp4` quando a pessoa aprovar.
