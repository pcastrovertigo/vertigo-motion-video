# Voz (locução)

As falas vêm de `narracao/roteiro.json`; cada `id` vira `narracao/<id>.mp3`. A duração de cada fala
define o ritmo do vídeo, e as pausas dentro dela sincronizam a legenda.

## ElevenLabs pela API

```bash
node scripts/voz.mjs narracao api <voice_id> pt        # gera só as que faltam
node scripts/voz.mjs narracao api <voice_id> pt n01,n20   # refaz estas
```

- **Chave**: nunca no chat. A pessoa grava com
  `! mkdir -p ~/.config/vertigo-motion-video && read -s -p "Chave: " K && echo "$K" > ~/.config/vertigo-motion-video/elevenlabs.key && chmod 600 ~/.config/vertigo-motion-video/elevenlabs.key`
  Se ela colar a chave no chat mesmo assim, grave no arquivo, não a repita e recomende trocá-la depois.
- **Permissão**: o modo automático do Claude Code pode bloquear o envio da chave a um serviço externo.
  Peça que a pessoa libere no `/permissions` a regra `Bash(node <caminho-da-skill>/scripts/voz.mjs:*)`.
- **Plano**: no plano gratuito a API **não** usa vozes da biblioteca (erro 402 `paid_plan_required`);
  só as vozes padrão. Com voz da biblioteca: plano Starter, ou geração pelo site.
- A API devolve o alinhamento por letra (`<id>.json`) — a legenda fica exata.
- Gasto: ~1.600 caracteres para 2,5 min de vídeo. O script só gera o que falta.

## ElevenLabs pelo site

`node scripts/voz.mjs narracao textos` lista `nNN.mp3 → texto`. A pessoa gera cada fala com a voz
escolhida e salva com o nome exato na pasta `narracao/`. Dica para ela: respiro depois da primeira
oração das falas importantes — as pausas viram quebras de legenda e pontos de sincronia.

## Voz do sistema

`node scripts/voz.mjs narracao sistema pt-BR` — Windows/WSL (SAPI, ex.: Microsoft Maria), macOS (`say`,
Luciana/Samantha), Linux (`espeak-ng`, precisa estar instalado). Gratuita e imediata; serve bem como
**faixa provisória** para acertar tempos enquanto a voz final não chega.

## Só legenda

Não gere áudio: o motor estima a duração pela leitura (~0,38 s por palavra) e a legenda aparece no
mesmo ritmo. A trilha não abaixa (não há voz).

## Conferência

`node scripts/voz.mjs narracao conferir` lista duração por fala e o total. Você não ouve o áudio —
confira se a ordem e as durações batem com o tamanho dos textos (uma fala longa com 1 s é arquivo
trocado) e peça à pessoa para ouvir o resultado.
