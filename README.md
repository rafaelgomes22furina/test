# MegaLoja · Click & Collect

Protótipo de e-commerce com **retirada na loja (Click & Collect)** e entrega em casa.
Agora com **frontend separado em pastas**, **backend Node/Express funcional**, **validação de CEP** e **lojas em endereços reais**.

## Como rodar

```bash
npm install
npm start            # http://localhost:3000  (frontend + API no mesmo processo)
npm test             # 27 testes do backend (sem internet)
npm run test:e2e     # frontend real + backend real (jsdom)
```

Requer Node 18.17+. Não abra o `index.html` direto do disco: o frontend conversa com a API em `/api`.

## Estrutura

```
megaloja-click-collect/
├── backend/
│   ├── server.js                 entrada (npm start)
│   ├── src/
│   │   ├── app.js                monta o Express (injeção de dependências → testável)
│   │   ├── config/               portas, regras de preço, timeouts
│   │   ├── routes/               mapa das rotas /api
│   │   ├── controllers/          camada HTTP fina
│   │   ├── services/             regra de negócio: cep, lojas, estoque, pedidos, preços
│   │   ├── repositories/         persistência dos pedidos (arquivo JSON)
│   │   ├── middleware/           erros, rate limit, cabeçalhos de segurança
│   │   ├── data/                 lojas reais, estoque simulado
│   │   └── utils/                cep, cpf, geo, horários
│   └── tests/                    testes unitários e de API
├── frontend/
│   ├── index.html                só estrutura (a ordem dos <link>/<script> importa!)
│   ├── css/                      01…15, numerados = ordem da cascata
│   ├── js/                       config · api · services · utils (novos) + core · data · components · screens · features
│   └── assets/img/               as 67 imagens que estavam em base64 dentro do HTML
└── e2e/                          teste ponta a ponta
```

## API

| Método | Rota | Para quê |
|---|---|---|
| GET | `/api/cep/:cep` | Valida formato, confirma que existe e devolve rua/bairro/cidade/UF (+ lat/lng quando houver) |
| GET | `/api/stores?cep=` | Lojas com distância, horário em tempo real, mapa e rota. Com CEP: ordenadas da mais próxima |
| GET | `/api/stores/:id` | Uma loja |
| POST | `/api/stock/query` | `{productIds:[…]}` → o que falta em cada loja |
| POST | `/api/orders` | Cria pedido (`type: "pickup"` ou `"delivery"`) validando CPF, estoque, CEP e totais |
| GET | `/api/orders/:id` | Consulta (CPF sempre mascarado) |
| PATCH | `/api/orders/:id/status` | Avança: `separating → ready` (retirada) ou `→ shipped → delivered` (entrega) |
| POST | `/api/pickups/validate` | Balcão confere o código `{code}`; **não** consome |
| POST | `/api/pickups/:id/complete` | Balcão entrega os produtos; o código **só vale uma vez** |

Erros: `{ "error": { "code": "CEP_NAO_ENCONTRADO", "message": "…" } }` — ex.: `CEP_INVALIDO` (400), `CEP_NAO_ENCONTRADO` (404), `CEP_SERVICO_INDISPONIVEL` (503), `ITENS_INDISPONIVEIS` (409), `CODIGO_JA_UTILIZADO` (409), `PRAZO_EXPIRADO` (409).

## O que mudou (cada trecho alterado no código tem um comentário `[MUDANÇA · …]`)

1. **Código em pastas.** O HTML único de 1,4 MB virou `index.html` + `css/` (15 arquivos) + `js/` (organizado por responsabilidade) + `assets/img/`. Os scripts continuam "clássicos" (escopo global) porque o protótipo usa `onclick="…"` em todo lugar; por isso a ordem de carregamento foi preservada exatamente. Código morto removido: a primeira versão da busca/favoritos, que era sobrescrita mais abaixo.
2. **Backend funcional.** API REST acima, com validação de entrada, erros padronizados, limite de consultas no CEP, cabeçalhos de segurança (CSP) e pedidos gravados em `backend/var/orders.json` (sobrevivem a reinício). O frontend deixou de simular: criar pedido, avançar separação/pronto, validar e consumir o código passam pelo servidor.
3. **Validação de CEP** em duas camadas: formato (máscara `00000-000`, rejeita `00000-000`, `11111-111`…) no navegador **e** no servidor; depois consulta real em cascata **BrasilAPI → ViaCEP → AwesomeAPI** (se um cai, tenta o próximo), com cache. Na entrega, o formulário preenche rua/bairro/cidade/UF sozinho, bloqueia CEP inexistente e o servidor confere se o CEP pertence à cidade/UF informadas. Se todos os provedores estiverem fora, a compra segue (`cepVerified:false`) em vez de travar.
4. **Lojas reais.** Saíram as 4 lojas inventadas; entraram endereços de shoppings reais (veja abaixo). A distância agora é calculada a partir do CEP do cliente, o horário ("Aberta · fecha às 22h", "Fechada · abre amanhã às 10h") é calculado no relógio de Brasília, e o mapa SVG fake virou **mapa real do OpenStreetMap** + botão "Como chegar" (Google Maps, pelo endereço).
5. Textos que citavam as lojas antigas (chat, retiradas recentes, pedidos, login, menu do funcionário) foram atualizados; "+120 lojas" agora mostra o número real.

## Lojas (edite em `backend/src/data/stores.js`)

| Loja | Endereço |
|---|---|
| MegaLoja Bourbon São Leopoldo | Rua Primeiro de Março, 821 – Centro, São Leopoldo/RS |
| MegaLoja Iguatemi Porto Alegre | Av. João Wallig, 1800 – Passo d'Areia, Porto Alegre/RS |
| MegaLoja Praia de Belas | Av. Praia de Belas, 1181 – Praia de Belas, Porto Alegre/RS |
| MegaLoja BarraShoppingSul | Av. Diário de Notícias, 300 – Cristal, Porto Alegre/RS |

Como você não indicou a cidade, usei a Grande Porto Alegre / Vale do Sinos. "MegaLoja" é marca fictícia, então são balcões supostos dentro de shoppings reais — troque pelas filiais verdadeiras.

## Limitações conhecidas (leia antes de ir para produção)

- **Latitude/longitude das lojas são aproximadas** (± algumas centenas de metros): servem para ordenar por distância e posicionar o pino. A rota do "Como chegar" usa o endereço, então é exata. Confira com o Google Maps.
- **Horários são o padrão de shopping** (seg–sáb 10h–22h, dom 14h–20h); Praia de Belas e Iguatemi bateram com listagens públicas, os outros dois não foram confirmados.
- **Estoque é simulado** (`backend/src/data/stock.js`), reproduzindo os cenários do protótipo (parcial, sem estoque…). Ligue ao seu ERP.
- **Preços ainda vêm do navegador**: o catálogo continua sendo gerado no frontend, então o servidor valida formato e recalcula totais, mas não é dono dos preços. Em produção o catálogo deve morar no backend.
- **Sem autenticação**: as rotas do balcão (`/pickups/*`, `PATCH status`) estão abertas porque a mesma tela faz papel de cliente e funcionário. Proteja antes de publicar.
- **Persistência em arquivo JSON**: ótimo para demo, troque `order.repository.js` por um banco de dados.
- Os provedores de CEP são serviços gratuitos de terceiros, sujeitos a limites e instabilidade — por isso a cascata e o cache.
