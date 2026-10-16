# Roteiro

O roteiro decide se o vídeo prende ou não. As telas mostram *o quê*; a fala diz *por que importa*.

## Estrutura por formato

| Formato | Gancho | Abertura | Corpo | Final | Total |
|---|---|---|---|---|---|
| Teaser | 3–6 s | — (ou 4 s) | 3–4 telas, 1 fala curta cada | 3–4 s | 30–45 s |
| Demonstração | 6–10 s | ~9 s (o que é + trilha de etapas) | 1 capítulo por etapa, 2–5 telas cada | 5–7 s | 2–3 min |
| Tutorial | 4–6 s | ~6 s (o que vamos fazer) | passos numerados, 1 tela por passo, mais cliques | 4 s | livre |

Na demonstração, as **etapas** (trilha no topo) são o fio condutor: o espectador sempre sabe onde
está. Capítulos com o mesmo número de etapa compartilham a bolinha da trilha.

## O gancho (3 primeiros segundos)

Abra com tensão ou resultado, nunca com "Olá, este é o sistema X". Padrões que funcionam:

- **Relógio** (`estilo: relogio`): contagem regressiva até uma hora-alvo, estalo de luz, a entrega pronta.
  Ideal quando o produto faz algo sozinho num horário. Ex.: "Faltam três segundos para o relatório do
  mês sair." → "Oito em ponto: o relatório está com a diretoria. Sem ninguém apertar um botão."
- **Manchete** (`estilo: manchete`): frase forte palavra por palavra sobre as telas caindo em leque.
  Ex.: "Assinar um contrato nunca foi *tão simples*."
- **Pergunta**: "Quanto tempo leva para um contrato ser assinado?" (use como texto da manchete).

A segunda frase do gancho precisa **dizer o que aconteceu e por que importa**. "E ele sai sozinho"
não funciona: o espectador não sabe o que é "sair sozinho" — a versão boa diz a hora, o resultado e
o benefício.

## Escrevendo as falas

- **Uma ideia por fala**, frases curtas, verbo no presente. Uma fala vira uma tomada (ou uma tela).
- **Vírgula e ponto viram pausa** — e a pausa vira a quebra da legenda e o tempo das animações.
  Peça à pessoa (ou à voz) respiro depois da primeira oração quando ela for importante.
- **Os nomes das telas como o cliente os vê** ("Gestão de Contratos", "Aprovação"), sem tecniquês
  (nada de "Client Extension", "endpoint", "workflow Kaleo").
- Ritmo de leitura: ~2,6 palavras/s em português na voz neural. Tomada com 1 tela: 3–6 s de fala.
- A fala do final é curta e assina: "Contrata+. A gestão de contratos de ponta a ponta. Uma solução Vertigo."

## Títulos na tela

Cada capítulo tem um título curto com **uma** palavra-chave em destaque entre asteriscos:
`"O contrato em *3 passos*"`, `"PDF *assinado* digitalmente"`. O destaque é a palavra que a pessoa deve
lembrar. Títulos não repetem a fala — complementam.

## Como apresentar para aprovação

Uma tabela por cena: nº · tempo aproximado · tela(s) · o que acontece (zoom, destaque, clique) · fala.
Logo abaixo, o visual (tema, elemento que atravessa o vídeo — a trilha de etapas com a folhinha) e o
que ainda depende da pessoa (voz, telas faltando). Espere o ok.

## `narracao/roteiro.json`

```json
[
  { "id": "n00", "text": "Faltam três segundos para o relatório do mês sair." },
  { "id": "n01", "text": "Oito em ponto: o relatório está com a diretoria. Sem ninguém apertar um botão." }
]
```

Os `id` são os nomes dos arquivos de áudio (`n00.mp3`) e o que as tomadas citam em `seg`.
Trocou o texto depois? Atualize aqui também — é daqui que sai a legenda.
