# Refatoração de Performance

Objetivo: eliminar queries lentas, reduzir payload e adicionar cache em todo o sistema.

## 1. Cache utilitário (novo)

Criar `src/lib/cache.ts`:
- `cacheSession(key, ttlMs, fetcher)` — sessionStorage com TTL
- `cacheMemory(key, ttlMs, fetcher)` — Map em memória com TTL
- `invalidate(prefix)` — limpar por prefixo

## 2. ForjaBey — cache de peças

Em `BladerForjaBey.tsx` e `AdminForjaBey.tsx`:
- Buscar `bey_blades`, `bey_ratchets`, `bey_bits`, `bey_lock_chips`, `bey_main_blades`, `bey_assist_blades` via `cacheSession` (TTL 1h, dados estáticos).
- Selecionar apenas colunas usadas pela UI (não `select('*')`).

## 3. Rankings com paginação + cache

`RankingPublicoPage.tsx` e `Leaderboard.tsx`:
- Paginação de 50 em 50 com `.range()`.
- Cache de 60s do top 50 da temporada ativa em memória.
- Buscar profiles em lote único (já faz) mas só colunas necessárias.

## 4. Torre X com paginação

`TorreX.tsx`:
- Paginação 30/página por cidade.
- Cache 30s do ranking da cidade atual.
- Histórico do user limitado a últimos 20.

## 5. Notificações — limite + paginação

`BladerNotificacoes.tsx` e `SinoNotificacoes.tsx`:
- `.limit(20)` + "carregar mais" com `.range()`.
- Sino: contar não-lidas via `.select('id', { count: 'exact', head: true })` em vez de baixar lista.

## 6. Feed de atividades — paginação

`FeedAmigos.tsx`:
- `.limit(20)` + scroll infinito com `.range()`.
- Cache 30s da primeira página.

## 7. Storage (`src/lib/storage.ts`)

- `getPlayers()` / `getPlayerById()`: cache em memória 30s (invalidado em add/update/delete).
- Trocar `select('*')` por colunas explícitas em `getTournaments`, `getInscricoes`.
- Adicionar `.limit()` onde faltar.

## 8. Hooks de times e amizades

`useTimes.ts`, `useAmizades.ts`, `useNotificacoesNaoLidas.ts`:
- `count: 'exact', head: true` para badges (zero payload).
- Cache 30s das listas.

## 9. Dashboard (`BladerHome`, `TopBladers`, `DashboardInsights`)

- Consolidar chamadas paralelas com `Promise.all`.
- Cache 60s das estatísticas agregadas.
- Limitar TopBladers a top 10 no servidor (não no client).

## 10. Skeleton states

Adicionar `<Skeleton>` em telas que faziam queries longas (Rankings, Torre X, Times, Notificações, Feed) para feedback imediato.

## Detalhes técnicos

- TTL padrão: 30s para dados dinâmicos, 60s para rankings, 1h para dados estáticos (peças).
- Cache invalidado em mutations relevantes (ex: criar time invalida cache de times).
- Realtime do Supabase continua funcionando — atualiza store local e invalida cache.
- Sem mudanças de schema (índices já foram criados na migration anterior).

## Arquivos editados

Novos: `src/lib/cache.ts`
Modificados: `BladerForjaBey.tsx`, `AdminForjaBey.tsx`, `RankingPublicoPage.tsx`, `Leaderboard.tsx`, `TorreX.tsx`, `BladerNotificacoes.tsx`, `SinoNotificacoes.tsx`, `FeedAmigos.tsx`, `storage.ts`, `useTimes.ts`, `useAmizades.ts`, `useNotificacoesNaoLidas.ts`, `BladerHome.tsx`, `TopBladers.tsx`, `DashboardInsights.tsx`.