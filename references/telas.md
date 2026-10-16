# Mapeamento das telas (câmera, destaque, clique)

Todas as coordenadas são **pixels da captura original** (antes de qualquer margem). O motor converte
para a tela do vídeo.

## Meça, não estime

Olhando a imagem, o erro típico é de ~20 px — o anel aparece deslocado e a pessoa percebe na hora
(aconteceu num vídeo real, no destaque de um campo de código). Fluxo:

1. Abra a captura para entender o layout e escolher os alvos.
2. Meça cada alvo com `scripts/medir.mjs`:
   ```bash
   node scripts/medir.mjs tela.png info              # 1320 x 996
   node scripts/medir.mjs tela.png caixa 300 770     # caixa [64, 744, 424, 50] centro (276, 769)
   node scripts/medir.mjs tela.png coluna 300 650 990    # desce pela coluna x=300: bordas (y) de cima e de baixo
   node scripts/medir.mjs tela.png linha 790             # atravessa a linha y=790: bordas (x) da esquerda e da direita
   node scripts/medir.mjs tela.png recorte 40 700 620 300 /tmp/zoom.png 2   # amplia para conferir
   ```
   `caixa` parte de um ponto dentro do elemento e anda até a borda. Escolha o ponto **no fundo do
   elemento, fora da linha de texto** (perto da borda interna, entre o texto e a borda): ela atravessa
   letras pequenas, mas uma palavra inteira pode parecer borda. Confira com `linha`/`coluna` quando
   o resultado parecer estreito demais. Elementos dentro do alvo (um botão dentro de uma barra de
   busca, um ícone num campo) também param a `caixa` — nesses casos, meça as bordas externas com
   `linha`/`coluna` longe dos cantos arredondados. Para clicar num botão, use o centro devolvido por `caixa`.
3. `hl.r` = a caixa medida (o motor já soma uma folga de 8 px). `clicks.p` = o centro do botão.
4. `cam` = um retângulo um pouco maior que a área de interesse, incluindo o título dela se houver.

## Câmera

- Comece na tela inteira (`null`) e aproxime no primeiro terço da fala: o espectador se localiza
  antes do zoom.
- Não passe de `zoomMax` (1,7): capturas 1× borram. Para ver detalhe pequeno, prefira recapturar com
  `deviceScaleFactor: 2`.
- O retângulo da câmera deve caber a largura do conteúdo que importa — se cortar um campo pela
  metade no zoom, aumente o retângulo (foi o que gerou a reclamação de "conteúdo colado nas bordas").
- Captura recortada rente ao conteúdo (sem margem branca): use `projeto.margens` para dar respiro.

## Destaques e cliques

- No máximo um destaque por vez; troque a cada 1,5–3 s. A etiqueta (`l`) diz em 2–4 palavras o que a
  fala está dizendo.
- Sincronize `u` com a palavra da fala: `u ≈ (tempo da palavra + 0,35) / duração da tomada`.
  Os tempos de cada palavra ficam em `<trabalho>/tempos-palavras.json` depois do primeiro build.
- O clique acontece depois que a fala chegou ao ponto ("…e assume a tarefa" → clique em "Assumir").
- A etiqueta fica acima do anel; se não couber, vai para baixo. Se cobrir um título importante da
  tela, force o outro lado com `"lado": "abaixo"` (ou `"acima"`) no destaque, ou encurte o texto.
  Se embaixo não couber, a etiqueta volta para cima (nunca entra no anel) — confira na prévia; a
  saída então é afastar a câmera, mover o destaque ou encurtar a etiqueta.
- Dado pessoal visível (nomes, CPF, e-mail) que não pode aparecer: `ocultar` na parte desfoca a região.
- `linha`/`coluna` sobre um parágrafo lista dezenas de bordas (cada letra é uma): passe por áreas de
  fundo, não por cima de texto.

## O que conferir na prévia

Texto colado em borda · anel fora do lugar · cursor clicando no vazio · etiqueta cobrindo informação ·
dado de teste visível ("TESTE") · nome de pessoa real que não deveria aparecer · tela borrada pelo zoom.
