# Captura automática de telas

`scripts/captura.mjs` lê um plano e grava `telas/<id>.png`. Use quando a pessoa não tiver as capturas
ou quando precisar refazer telas com defeito.

## Plano (`capturas.json`)

```json
{
  "base": "https://sistema.exemplo.com.br",
  "saida": "telas",
  "ignorarCertificado": true,                 // certificados internos (comum em ambientes de teste)
  "liferay": true,                            // fecha o menu lateral do Liferay antes da foto
  "envArquivo": ".env",                       // de onde vêm as credenciais (fora do git!)
  "esconder": [".banner-cookies"],            // seletores extras a esconder na foto
  "sessoes": {
    "aprovador": { "login": { "url": "/login", "usuario": "#login", "senha": "#password",
                 "entrar": "button[type=submit]", "envUsuario": "VMV_USER_APROVADOR", "envSenha": "VMV_PASS_APROVADOR" } }
  },
  "capturas": [
    { "id": "aprovacao-lista", "sessao": "aprovador", "url": "/caminho/da/tela",
      "viewport": [1366, 768], "recorte": ".app-shell",
      "passos": ["esperar:.app-shell", "clicar:.item >> nth=0", "esperar:button:has-text(\"Aprovar\"):enabled", "pausa:1500"] }
  ]
}
```

Passos: `esperar:<sel>` · `clicar:<sel>` · `clicar-se:<sel>` (só se existir) · `preencher:<sel>=<valor>` ·
`selecionar:<sel>=<valor>` · `enviar:<sel input file>=<arquivo>` · `rolar:<sel>` · `rolar-fim:<sel>`
(painel com rolagem própria) · `esconder:<sel>` · `pausa:<ms>`. Recorte: `recorte` (seletor) com
`margem` opcional, ou `clip: [x, y, w, h]`, ou nada (viewport inteira).

```bash
node scripts/captura.mjs capturas.json                # só as que faltam
node scripts/captura.mjs capturas.json --id aprovacao-lista
node scripts/captura.mjs capturas.json --refazer --debug /tmp/dbg   # mostra o passo que falhou + foto
node scripts/captura.mjs capturas.json --relogar      # descarta sessões salvas (expiraram)
```

## O que o script corrige sozinho (e por quê)

- **"X" atravessando selos e botões**: bug de antialiasing do Chromium headless (rasterização por
  software, comum no WSL) em caixas com fundo `rgba` translúcido + cantos arredondados. Antes da
  foto, cada cor translúcida vira a cor opaca equivalente — imagem idêntica, sem o defeito.
- **Menu lateral aberto** (sessão nova do Liferay) que espreme a tela; **avisos flutuantes** e
  **dicas de botão** (tooltip); **cursor parado sobre um botão** (hover) e **foco** do último clique.
- **Barra fixa do topo** vazando no recorte: o corte começa abaixo de qualquer barra fixa.

## Armadilhas conhecidas

- **Espere o estado final**: editor rico "Carregando…", prévia com spinner, botão desabilitado
  enquanto carrega. Espere o elemento que só existe pronto (`iframe` do editor, `button:enabled`) e
  acrescente `pausa`.
- **Sessão expirada**: o site redireciona para o SSO e o `esperar` estoura. Rode com `--relogar`.
- **Login SSO** (Microsoft etc.) não é automatizável: use uma rota de login nativo, se existir, ou peça
  as capturas prontas.
- **Rede interna**: VPN ligada. No WSL, o túnel pode exigir MTU menor (`sudo ip link set dev eth0 mtu 1350`)
  — sintoma: DNS resolve, TCP abre e o TLS trava.
- **Gravar dados para ter a tela** (cadastrar, assumir tarefa): só com o ok de quem é dono do
  ambiente, com dados de aparência real (nada de "TESTE"), e apague depois. Registros de outras
  pessoas não se tocam. Algumas regras de negócio só deixam o criador excluir um rascunho.
