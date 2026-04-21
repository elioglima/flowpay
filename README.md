# FlowPay — Documentação do projeto

**Autor:** **elio.lima** · [elio.designer@hotmail.com](mailto:elio.designer@hotmail.com)

Sistema de **distribuição e monitoramento** de solicitações para central de relacionamento: três **times** (cartões, empréstimos, outros), **até 3 atendimentos simultâneos por atendente**, **fila FIFO por time** e **dashboard em tempo real** (SSE).

Este repositório é um **monorepositório**: API em `api/`, interface em `front/`, Docker em `docker/` e script `start.sh` na raiz.

---

## Sumário

1. [Tecnologias utilizadas](#tecnologias-utilizadas)  
2. [Visão geral do negócio](#visão-geral-do-negócio)  
3. [Backend — `api/`](#backend--api)  
4. [Frontend — `front/`](#frontend--front)  
5. [Ambiente e execução](#ambiente-e-execução)  
6. [Docker](#docker)  
7. [Outros ficheiros](#outros-ficheiros)  
8. [Autor](#autor)

---

## Tecnologias utilizadas

Visão consolidada do que o projeto usa em cada camada. Versões alinhadas aos `package.json` de `api/` e `front/` (ajustar conforme upgrades locais).

### Plataforma e integração

| Tecnologia | Uso |
|------------|-----|
| **Node.js** | Runtime da API e ferramentas de build/teste. |
| **TypeScript** | Tipagem estática na API e no front (`^5.8`). |
| **MongoDB** | Base de dados (persistência de agentes e tickets). |
| **Docker** / **Docker Compose** | Orquestração de serviços (`docker/`). |
| **Bash** | Script [`start.sh`](start.sh) para subir MongoDB, API e front em dev. |
| **SSE** (Server-Sent Events) | API em `GET /api/stream`; browser com `EventSource` no painel. |

### Backend — `api/`

| Tecnologia | Uso |
|------------|-----|
| **Express** (`^4.21`) | Servidor HTTP, rotas REST, middleware CORS e JSON. |
| **Mongoose** (`^8.12`) | ODM e modelos MongoDB (`Agent`, `Ticket`). |
| **cors** | Middleware CORS. |
| **dotenv** | Carregamento de variáveis de ambiente. |
| **tsx** | Execução TypeScript em dev (`tsx watch`). |
| **Vitest** + **@vitest/coverage-v8** | Testes e cobertura (thresholds 100%). |
| **supertest** | Testes HTTP sobre a app Express. |

### Frontend — `front/`

| Tecnologia | Uso |
|------------|-----|
| **Next.js** (`^15.2`, App Router) | Framework React, rotas em `app/`, build e SSR/SSG. |
| **React** / **React DOM** (`^19.1`) | UI do dashboard. |
| **Recharts** (`^2.15`) | Gráficos do monitoramento (`dashboardCharts`). |
| **CSS global** | Estilos em `app/globals.css` (sem Tailwind/Bootstrap). |

### Stack (detalhe por pasta)

As secções [Backend — `api/`](#backend--api) e [Frontend — `front/`](#frontend--front) abaixo repetem a stack com scripts e estrutura de ficheiros.

---

## Visão geral do negócio

| Conceito | Comportamento |
|----------|----------------|
| Times | `cards`, `loans`, `other` — roteados por **texto exato** de dois assuntos ou “demais” para outros. |
| Capacidade | `MAX_CONCURRENT_PER_AGENT = 3`; seed com **6 atendentes** (2 por time). |
| Fila | Tickets `queued` por time; promoção **FIFO** por `createdAt`. |
| `activeAt` | Preenchido ao ficar `active`; usado no front para o timer de auto-encerramento (intervalo **aleatório 5–15 s por ticket**) e “Execução”. |
| Após encerrar | **200 ms** antes de tentar promover; **+500 ms** se existir `queued` naquele time. |

**Assuntos com roteamento fixo (API):**

- `Problemas com cartão` → cartões  
- `Contratação de empréstimo` → empréstimos  
- qualquer outro texto → outros assuntos  

---

## Backend — `api/`

### Stack

**Node.js**, **TypeScript**, **Express**, **Mongoose**, **cors**, **dotenv**; testes com **Vitest**, **@vitest/coverage-v8** e **supertest** (**tsx** em dev). Tabela completa em [Tecnologias utilizadas](#tecnologias-utilizadas).

### Scripts (`api/package.json`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | `tsx watch src/main.ts` — API com reload. |
| `npm run build` | Compila `src/` → `dist/` (`tsc`). |
| `npm start` | `node dist/main.js`. |
| `npm test` | Vitest, execução única. |
| `npm run test:watch` | Vitest em modo observação. |
| `npm run test:coverage` | Cobertura; relatórios em `api/coverage/` (html, lcov, json). |

### Estrutura de pastas e ficheiros

| Caminho | Função |
|---------|--------|
| `src/main.ts` | Entrada: `dotenv`, `connectDatabase`, `seedAgentsIfEmpty`, `createApp`, HTTP server na `PORT`. |
| `src/createApp.ts` | Express: `cors`, `json`, rotas, middleware de erro 500. |
| `src/bootstrap/seedAgents.ts` | Cria os 6 atendentes se a coleção estiver vazia. |
| `src/infrastructure/database/connectDatabase.ts` | Ligação MongoDB via `MONGODB_URI`. |
| `src/infrastructure/sse/sseHub.ts` | Clientes SSE; broadcast do snapshot. |
| `src/models/agentModel.ts` | Schema atendente (`team`, `name`, `activeAssignments`). |
| `src/models/ticketModel.ts` | Schema ticket (`subject`, `team`, `status`, `agentId`, `activeAt`, `closedAt`, timestamps). |
| `src/domain/team.ts` | `Team`, `MAX_CONCURRENT_PER_AGENT`. |
| `src/domain/subjectCatalog.ts` | Constantes de assunto + `resolveTeamBySubject`. |
| `src/domain/escapeRegex.ts` | Escape para regex na busca de encerrados. |
| `src/domain/ticketErrors.ts` | `TicketNotFoundError`, `TicketInvalidStateError`. |
| `src/application/distributionService.ts` | Criação, conclusão, fila, snapshot, lista encerrados, reset, delays, SSE push. |
| `src/application/ticketMapper.ts` | `mapTicket` — DTO para o front. |
| `src/presentation/http/registerRoutes.ts` | Montagem das rotas sob `/health`, `/api/...`. |
| `src/presentation/http/routes/healthRouter.ts` | Health check. |
| `src/presentation/http/routes/ticketRouter.ts` | Tickets: criar, encerrados, reset, complete. |
| `src/presentation/http/routes/dashboardRouter.ts` | GET snapshot. |
| `src/presentation/http/routes/streamRouter.ts` | SSE: subscreve cliente, envia evento inicial com snapshot. |
| `src/**/*.test.ts` | Testes unitários (excluídos do `tsc` de produção). |
| `vitest.config.ts` | Configuração Vitest e cobertura. |

### Variáveis de ambiente

Definição de exemplo: [`.env.example`](.env.example).

| Variável | Uso |
|----------|-----|
| `MONGODB_URI` | Obrigatória — URI do MongoDB. |
| `PORT` | Porta HTTP da API (predefinido em código: `3001`). |

### Endpoints REST

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/health` | Estado do serviço. |
| `POST` | `/api/tickets` | Body `{ "subject": string }` — cria ticket, atribui ou enfileira. |
| `GET` | `/api/tickets/closed` | `page`, `pageSize` (≤50), `q` opcional (regex case-insensitive no assunto). |
| `POST` | `/api/tickets/reset` | Apaga tickets e zera `activeAssignments` — **204**. |
| `POST` | `/api/tickets/:ticketId/complete` | Encerra `active` — 204 ou erros 400/404. |
| `GET` | `/api/dashboard` | JSON: agentes, `openTickets`, `queueLengths`, `closedByTeam`, etc. |
| `GET` | `/api/stream` | **SSE** `text/event-stream`; primeiro evento `data: { type: "dashboard", payload }`; atualizações via broadcast após mutações. |

### Testes

Foco em **lógica pura**: `resolveTeamBySubject`, `escapeRegex`, `mapTicket`, erros, constantes de `team`. Integração com MongoDB não está incluída nos testes atuais.

---

## Frontend — `front/`

### Stack

**Next.js 15** (App Router), **React 19**, **TypeScript**, **Recharts**. Estilos em **CSS global** (`app/globals.css`). Lista completa em [Tecnologias utilizadas](#tecnologias-utilizadas).

### Scripts (`front/package.json`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | `next dev` — desenvolvimento. |
| `npm run build` | Build de produção. |
| `npm start` | Servidor Next em produção. |

### Estrutura de pastas e ficheiros

| Caminho | Função |
|---------|--------|
| `app/page.tsx` | Página inicial — renderiza `DashboardShell`. |
| `app/layout.tsx` | Layout raiz, fonte Inter, `viewport`, metadata FlowPay. |
| `app/dashboardShell.tsx` | Estado, efeitos (fetch, SSE, debounce) e composição do painel. |
| `app/components/` | Componentes de UI (cabeçalho, simulação, filas, medidor de carga na fila, tickets abertos/encerrados, gráficos, rodapé). |
| `app/components/queueLoadGauge.tsx` | Medidor semicircular da carga total na fila (soma dos times; escala em `QUEUE_GAUGE_SCALE_MAX`). |
| `app/dashboardCharts.tsx` | Gráficos Recharts (filas, ocupação, abertos por time, concluídos por time). |
| `app/globals.css` | Tema escuro slate/navy, painéis, listas, responsivo, safe-area. |
| `lib/getApiBaseUrl.ts` | Base URL: `NEXT_PUBLIC_API_URL` ou `http://localhost:3001`. |
| `lib/dashboardConstants.ts` | Constantes do painel (paginação, faixa de auto-release, escala do medidor de fila, rótulos por time). |
| `lib/autoReleaseRandomUtils.ts` | Duração aleatória de auto-encerramento entre `AUTO_RELEASE_MS_MIN` e `AUTO_RELEASE_MS_MAX`. |
| `lib/queueGaugeUtils.ts` | Soma das filas por time e percentagem para o medidor. |
| `lib/ticketDisplayUtils.ts` | Ordenação, início do atendimento ativo e formatação de datas dos tickets. |
| `lib/closedTicketsRangeUtils.ts` | Texto de intervalo da paginação dos encerrados. |
| `lib/dashboardTypes.ts` | Tipos TS alinhados ao snapshot da API (inclui `AutoReleaseScheduleEntry` para o timer por ticket). |
| `lib/subjectCatalog.ts` | Assuntos usados nos botões de teste (alinhados à API). |
| `lib/agentAccentColors.ts` | Paleta por atendente + `getAgentAccentColor`. |
| `lib/agentUserIcon.tsx` | Ícone de utilizador na lista de atendentes. |
| `lib/queueTeamIcons.tsx` | Ícones por time (`inline` ou `hero` para cards “Em aberto”). |

### Variável de ambiente

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_API_URL` | URL base da API no browser (fetch + `EventSource`). |

### Comportamento do painel (`dashboardShell`)

- **Carregamento inicial:** `GET /api/dashboard`.  
- **Tempo real:** `EventSource` em `/api/stream`; atualiza estado ao receber `type: "dashboard"`.  
- **Testes e simulação:** pedido único por assunto; lotes por time (`QUEUE_SIMULATE_BURST` = 18); lote misto com contagens em `mixedBatchByTeam` (ex.: 7+13+17); **Reiniciar tudo** → `POST /api/tickets/reset`.  
- **Checkbox auto-encerramento:** para cada ticket ativo é sorteado um intervalo entre **5 e 15 s** (a partir de `activeAt`); ao expirar, chama `POST /api/tickets/:id/complete`. O estado fica em `releaseSchedule` no shell (deadline e duração por id).  
- **Medidor de carga na fila:** semicírculo com soma dos registos em fila de todos os times; escala visual até **`QUEUE_GAUGE_SCALE_MAX` (200)** — ver `queueLoadGauge` e `queueGaugeUtils`.  
- **Filas por time:** contagens + ícones por time.  
- **Atendentes:** lista com ícone de utilizador e cor por atendente.  
- **Em aberto:** paginação (**20** por página); cartões com ícone grande por time, tarja/cor por atendente, barra de tempo alinhada ao intervalo **5–15 s** do ticket, botão Encerrar.  
- **Monitoramento:** gráficos com dados do snapshot.  
- **Encerrados:** `GET /api/tickets/closed` com debounce de pesquisa, paginação (**10** por página).  
- **Rodapé:** nome **elio.lima**, e-mail e data “Atualizado em” (data local do browser).  

### UI e constantes relevantes (código)

| Constante | Valor (típico) |
|-----------|----------------|
| `AUTO_RELEASE_MS_MIN` / `AUTO_RELEASE_MS_MAX` | 5000 / 15000 (faixa **5–15 s** por pedido na simulação de auto-encerramento) |
| `QUEUE_GAUGE_SCALE_MAX` | 200 (teto da escala do medidor de soma das filas) |
| `QUEUE_SIMULATE_BURST` | 18 |
| `OPEN_PAGE_SIZE` | 20 |
| `CLOSED_PAGE_SIZE` | 10 |

---

## Ambiente e execução

### Variáveis (raiz)

O [`.env.example`](.env.example) cobre API + front para desenvolvimento local.

### Um comando (`./start.sh`)

- Sobe MongoDB em Docker (`flowpay-mongo`).  
- Liberta portas da API e do front (predef.: **3001** / **3000**).  
- Exporta `MONGODB_URI`, `PORT`, `NEXT_PUBLIC_API_URL`.  
- API: `tsx watch`; front: `next dev --turbo`.  

Portas opcionais: `API_PORT`, `FRONT_PORT`.

### Manual

```bash
# API
cd api && npm install
export MONGODB_URI="mongodb://127.0.0.1:27017/flowpay"
export PORT=3001
npm run dev

# Front
cd front && npm install
export NEXT_PUBLIC_API_URL="http://localhost:3001"
npm run dev
```

### Build de produção

```bash
cd api && npm run build && npm start
cd front && npm run build && npm start
```

---

## Docker

```bash
docker compose -f docker/docker-compose.yml up --build
```

- Front: `http://localhost:3000`  
- API: `http://localhost:3001`  
- MongoDB: conforme portas expostas no compose  

---

## Outros ficheiros

| Item | Descrição |
|------|-----------|
| `docker/` | Compose e imagens para API, front e MongoDB. |

---

## Autor

| | |
|--|--|
| **Nome** | elio.lima |
| **E-mail** | [elio.designer@hotmail.com](mailto:elio.designer@hotmail.com) |

O mesmo contacto aparece no rodapé da aplicação web (dashboard).
