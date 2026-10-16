# projeto.json

Tudo o que muda de um vídeo para outro mora aqui. Caminhos relativos são resolvidos a partir da
pasta do próprio `projeto.json`. Projeto-modelo completo: `exemplos/modelo/projeto.json`.

## Sumário
- Campos gerais
- Temas
- Marca final
- Etapas e capítulos
- Tomadas (gancho, abertura, telas, final)
- Transições e tempo

## Campos gerais

```json
{
  "titulo": "Contrata+ de ponta a ponta",          // título do HTML
  "arquivo": "contrata-demonstracao",             // base dos nomes: <arquivo>-vertical.mp4, -horizontal.mp4, -leve.mp4
  "idioma": "pt-BR",                         // "en" troca rótulos (STEP, SIGNED)
  "formatos": ["v", "h"],                    // v = 1080×1920, h = 1920×1080
  "tema": "papel",                           // "papel" | "escuro" | "claro" | { objeto, ver Temas }
  "telas": "telas",                          // pasta das capturas (png/jpg/webp, nome = id da tela)
  "narracao": "narracao",                    // pasta com roteiro.json + nNN.mp3 (+ nNN.json de alinhamento)
  "saida": ".",                              // onde ficam MP4 e HTML
  "musica": { "tipo": "sintetizada" },       // ou { "tipo": "arquivo", "arquivo": "trilha.mp3", "volume": 0.5 }
  "legenda": true,
  "margens": { "tela-recortada-rente": 36 }, // margem branca (px) para capturas sem respiro
  "zoomMax": 1.7,                            // zoom máximo (capturas 1×: acima disso a imagem borra)
  "marca": { ... }, "etapas": [ ... ], "capitulos": { ... }, "tomadas": [ ... ]
}
```

## Temas

`"papel"`, `"escuro"` e `"claro"` já vêm prontos. Para uma referência anexada, use um objeto: escolha a
base mais próxima e sobrescreva só os tokens que a referência pede.

```json
"tema": { "base": "claro", "acento": "#076CFE", "acentoTexto": "#076CFE", "tinta": "#0C1557",
          "suave": "#5B6478", "legendaFundo": "rgba(255,255,255,.94)", "base": "#F4F6FA" }
```

Tokens: `fundo` (papel|claro|escuro — o desenho do fundo), `base` (cor de fundo), `tinta` (texto),
`acento` (anéis, pílulas, trilha), `acentoTexto` (palavra em destaque; mais clara no escuro),
`suave` (rótulos secundários), `legendaFundo`/`legendaTinta`, `sombra`, `escurecer` (véu fora do
destaque), `trilhoBase`, `noVazio`, `noBorda`, `flash`, `poeira`, `relogioFace`, `marca` (claro|escuro: qual logo usar).
`"fonte": "\"Inter\", Arial, sans-serif"` troca a fonte (precisa estar instalada na máquina do render).

Regra: o design system da Vertigo é o padrão (azul #076CFE, Helvetica Neue, logo original); o que a
pessoa definir explicitamente vence. A cor do cliente entra como conteúdo (telas, logo), não como
acento — a não ser que a pessoa peça.

## Marca final

```json
"marca": { "vertigo": true, "cliente": { "nome": "Cliente", "logo": "marca/cliente.png" },
           "linha": "*Contrata+* · Gestão de contratos", "cta": "vertigo.com.br" }
```
`vertigo: false` tira a logo da Vertigo; `cliente: null` tira a do cliente; sem `linha`/`cta`, só logos.

## Etapas e capítulos

```json
"etapas": ["Configurar", "Cadastrar", "Revisar", "Aprovar", "Assinar", "Publicar", "Consultar"],
"capitulos": {
  "config":   { "etapa": 0, "titulo": "Tudo começa na *configuração*" },
  "cadastro": { "etapa": 1, "titulo": "O contrato em *3 passos*" },
  "extra":    { "tag": "BÔNUS", "titulo": "Relatórios *em tempo real*" }   // sem etapa: usa a tag
}
```
`etapas: []` remove a trilha do topo (bom para teaser e tutorial curto).

## Tomadas

Cada tomada é um trecho do vídeo. A duração vem das falas (`seg`): `lead` (0,35 s) + falas + `tail`
(0,55 s), arredondada para múltiplo de 0,5 s (a batida). `lead`, `tail` e `min` podem ser definidos
por tomada (ex.: `"lead": 0.1` para a primeira fala entrar já no primeiro quadro).

### Gancho
```json
{ "kind": "gancho", "estilo": "relogio", "seg": ["n00", "n01"], "voiceAt": [0.15, 3.3], "min": 6, "virada": 3,
  "relogio": { "alvo": "08:00:00", "legenda": "RELATÓRIO MENSAL" },
  "textos": [ { "texto": "Faltam *3 segundos* para o relatório do mês sair", "de": 0.1, "ate": 2.95 },
              { "texto": "Entregue às 8h, *sem apertar um botão*", "de": 3.3 } ],
  "selo": { "em": 5.9, "etiqueta": "ENVIO AUTOMÁTICO · 08:00", "etiquetaEm": 6.8 } }
```
`virada` = instante do estalo de luz (a contagem dura `virada` segundos). `voiceAt` fixa quando cada
fala começa — no relógio, a 2ª fala entra logo depois do estalo. Sincronize `selo.em` e `etiquetaEm`
com palavras da fala (use os tempos de `tempos-palavras.json`, ver ajustes.md).

`"estilo": "manchete"` troca o relógio por telas em leque: `"telas": ["a", "b"]` + `textos`.
No relógio a música entra no estalo (`virada`); na manchete, desde o primeiro quadro.

O gancho e o final **não mostram legenda** — o texto deles já está na tela (`textos`, `marca.linha`).
No modo só legenda, a fala dessas tomadas serve só para dar a duração: escreva `textos`/`linha`
com o que deve ser lido.

### Abertura (opcional)
```json
{ "kind": "abertura", "seg": ["n02"], "min": 9.5, "tag": "CONTRATA+ · GESTÃO DE CONTRATOS",
  "titulo": "Do cadastro à *assinatura*, sem papel", "telas": ["tela-a", "tela-b", "tela-c"] }
```
Na demonstração, a trilha de etapas se desenha durante a abertura.

### Tela
```json
{ "ch": "cadastro", "seg": ["n07"], "parts": [ {
    "img": "contrato-passo1-dados",
    "cam": [[0, null], [0.4, [20, 255, 740, 290]]],
    "hl": [ { "u": 0.42, "r": [33, 262, 715, 270], "l": "Dados do contrato" } ],
    "clicks": [ { "u": 0.95, "p": [688, 887] } ] } ] }
```
- `ch`: capítulo (título e etapa). Tomadas seguidas do mesmo `ch` formam um capítulo.
- `parts`: uma ou mais telas na mesma tomada (`u0` de cada parte: onde começa, 0–1). Trocas entre
  partes são um cruzamento suave.
- `cam`: chaves `[u, retângulo]` em coordenadas **da captura**; `null` = tela inteira. A câmera
  enquadra o retângulo (com zoom até `zoomMax`) e se move suavemente entre as chaves.
- `hl`: destaque (anel azul + véu + etiqueta `l`) a partir de `u`; `r: null` apaga o destaque;
  `"lado": "abaixo" | "acima"` força a posição da etiqueta (padrão: acima, se couber).
- `clicks`: o cursor entra, vai até `p` e clica no instante `u` (com som).
- `ocultar: [[x, y, w, h], ...]`: desfoca regiões da captura (nomes de pessoas, CPF, e-mail) sem
  precisar trocar a tela. Meça com `medir.mjs` como os destaques.
- `selo: { "em": 0.55 }`: carimbo "ASSINADO" na tela; `relogio: { "em": 0.5, "antes": "07:59:59", "depois": "08:00:00" }`: mini relógio virando.

`u` é a fração da parte (0 = começo, 1 = fim) — por isso as animações acompanham sozinhas se a fala
ficar mais longa ou mais curta.

### Final
```json
{ "kind": "final", "seg": ["n28"], "tail": 1.4 }
```
Fica pelo menos 2,5 s com logo e chamada na tela.

## Transições e tempo

Duração exata (ex.: teaser de 30 s cravados): cada tomada é arredondada para múltiplo de 0,5 s e o
final tem um mínimo de leitura. Rode `linha`, veja a sobra e ajuste `tail`/`lead`/`min` das tomadas
mais folgadas (e encurte uma fala, se preciso) — não corte o final abaixo de 2,5 s.

Automáticas: gancho → flash; mudança de capítulo → alterna tinta azul e zoom com luz; mesma
etapa → deslize com reflexo; última → final → brilho. Para forçar: `"transicao": "ink"|"zoom"|"slide"|"flash"|"light"`.
