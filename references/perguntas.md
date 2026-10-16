# Perguntas iniciais

Faça em duas rodadas de até 4 perguntas (ferramenta de múltipla escolha, se houver), sempre com a
opção recomendada primeiro. Se a pessoa já deu a resposta no pedido, confirme em vez de perguntar.

## Rodada 1 — o vídeo (5 perguntas: junte 1 e 4 numa só se a ferramenta limitar a 4)

1. **O que mostrar e para quem?** (texto livre se não estiver no pedido)
   Sistema/projeto, o fluxo ou funcionalidade, público (time interno, cliente, redes, evento).
2. **Formato**
   - Teaser 30–45 s — gancho, 3–4 telas-chave, chamada final. Redes e Stories.
   - Demonstração 2–3 min — fluxo completo, uma etapa por capítulo. Apresentações. *(recomendado quando não está claro)*
   - Tutorial de uma funcionalidade — passo a passo de uma tarefa, ritmo mais lento, mais cliques.
3. **Orientação**
   - Os dois (9:16 e 16:9) *(recomendado — mesmo roteiro, dois enquadramentos)*
   - Só vertical (celular, Reels, Stories)
   - Só horizontal (apresentação, YouTube, reunião)
4. **Telas** — de onde vêm?
   - Capturas que já existem (pasta) *(recomendado quando há — ex.: as de um manual)*
   - Captura automática do site (URL, perfil de cada tela, se pode gravar dados no ambiente)
   - As duas (usar as existentes e capturar só o que faltar ou estiver com defeito)
5. **Estilo visual**
   - Papel bege — fundo de papel claro, telas como cartões, azul Vertigo nos destaques.
   - Vertigo escuro — degradê azul-marinho, luzes desfocadas, brilho.
   - Claro corporativo — branco/cinza limpo, sóbrio, para clientes conservadores.
   - Referência anexada — a pessoa envia uma imagem/vídeo/site; você adapta ao design system da Vertigo,
     respeitando o que ela definir explicitamente.

## Rodada 2 — produção

6. **Idioma** — Português (pt-BR) ou Inglês. Define a fala, a legenda e rótulos ("ETAPA"/"STEP").
7. **Voz**
   - ElevenLabs pela API *(melhor qualidade e legenda exata; precisa de chave e, para vozes da biblioteca, plano pago)*
   - ElevenLabs pelo site — você entrega os textos, a pessoa gera e salva `n00.mp3`, `n01.mp3`…
   - Voz do sistema — gratuita e imediata, soa mais robótica.
   - Sem voz, só legenda.
8. **Música**
   - Trilha sintetizada *(recomendado — gerada no ritmo das animações, sem direitos autorais)*
   - Arquivo fornecido (MP3 licenciado) — a skill ajusta o volume sob a voz e faz loop se for curto.
9. **Marca final** — Vertigo · cliente (logo/nome que a pessoa fornecer) · Vertigo + cliente · nenhuma.
   Pergunte também a frase final e a chamada (padrão: nome do produto + `vertigo.com.br`).
10. **Pasta de saída**
   - Dentro do projeto atual (ex.: `./videos/<nome-do-video>/`)
   - Uma pasta específica (peça o caminho)
   - Pasta Vídeos do sistema — `bash scripts/pasta-videos.sh` (no WSL é a pasta Vídeos do Windows, no C:;
     confira o espaço livre lá).

Se a captura for automática, pergunte ainda: URL, qual perfil/usuário para cada tela, e se pode gravar
dados no ambiente (algumas telas só existem depois de cadastrar ou assumir uma tarefa). Gravar em
ambiente de outra pessoa exige o ok explícito dela — e limpar depois.

## Depois das respostas

Resuma as escolhas numa lista curta, diga a duração estimada do render
(~8–9 s por segundo de vídeo, por formato) e siga para o roteiro.
