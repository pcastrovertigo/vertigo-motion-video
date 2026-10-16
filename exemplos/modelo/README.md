# Projeto-modelo: Contrata+

Um teaser de ~40 s de um sistema **fictício** de gestão de contratos, com tudo o que um projeto
real tem: gancho em manchete, abertura, três capítulos com etapas, destaques medidos, cliques,
troca de tela dentro da tomada, selo "ASSINADO" e final com marca. As telas em `telas/` são
maquetes geradas para o exemplo (nenhum dado real).

Ele roda **sem áudio** (modo só legenda: o motor estima a duração pela leitura), então serve para
experimentar o motor sem gastar crédito de voz:

```bash
node scripts/build.mjs exemplos/modelo/projeto.json linha        # linha do tempo
node scripts/build.mjs exemplos/modelo/projeto.json previa v auto # folha de contato
```

Para um vídeo de verdade, copie a pasta para o projeto da pessoa e troque telas, falas e tomadas.

## O que este exemplo ensina

- **Gancho com pergunta ou resultado**, nunca "Olá, este é o sistema X". A segunda frase diz o que
  acontece e por que importa.
- **Coordenadas medidas, não estimadas.** Os retângulos de `hl` e os pontos de `clicks` saíram de
  `scripts/medir.mjs`. Num botão arredondado, meça clicando no fundo do botão, longe do texto
  (sobre a letra, a `caixa` devolve a própria letra), e confira os cantos com `linha`/`coluna`.
- **Câmera que não corta texto.** Um retângulo de `cam` que começa no meio de uma coluna deixa
  "da." e "S.A." na borda. Comece o corte no vão entre colunas — este exemplo foi corrigido assim
  depois da primeira prévia.
- **Troca de tela dentro da tomada** (`parts` com `u0`): o clique em "+ Novo contrato" acontece na
  lista e o formulário entra em seguida, sem corte.
- **Etiqueta abaixo** (`"lado": "abaixo"`) quando acima dela há texto importante.
- **Margens** (`projeto.margens`) para capturas recortadas rente ao conteúdo — aqui não foi preciso,
  porque as maquetes já têm respiro.
- **Telas reais**: antes de usar, procure dado de teste à vista, nomes de pessoas e o "X" do
  Chromium headless em selos translúcidos (o `captura.mjs` já corrige).
- **Disco no WSL**: o render cresce o disco virtual no C:. O `build.mjs` confere antes; se faltar
  espaço, capriche na prévia para não precisar de `trechos` depois.
