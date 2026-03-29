

# Beyblade X Tournament Hub

## Visão Geral
Aplicação web responsiva para gerenciamento de torneios de Beyblade X com design 2D premium, flat/estilizado, temática do anime com cores escuras (grafite), azul elétrico, verde neon e toques de vermelho.

## Design System
- **Fundo**: Grafite escuro (#0D0D0D, #1A1A2E)
- **Acentos**: Azul elétrico (#00D4FF), Verde neon (#39FF14), Vermelho (#FF2D55), Branco
- **Tipografia**: Rajdhani (headings) + Montserrat (body)
- **Estilo**: Flat design com bordas geométricas afiadas, painéis translúcidos, ícones minimalistas
- **Logo Beyblade X** em destaque no header de todas as telas

## Páginas e Funcionalidades

### 1. Dashboard / Tela Inicial
- Header com logo Beyblade X e navegação principal
- Resumo rápido: torneios ativos, total de jogadores
- Leaderboard em destaque (Top Semanal / Top Mensal com abas)
- Botões de ação: "Novo Torneio", "Cadastrar Jogador", "Rankings"

### 2. Módulo de Jogadores
- Formulário: Nome/Nickname + Upload de foto ou seleção de avatar padrão (avatares temáticos Beyblade)
- Lista de jogadores cadastrados com foto, nome e stats resumidos
- Persistência via LocalStorage

### 3. Configuração de Torneio
- Seleção de jogadores cadastrados (checkbox/cards clicáveis)
- Input de número de rodadas com sugestão automática (log2(N))
- Definição de número de arenas ativas (Arena A, Arena B, etc.)
- Botão "Iniciar Torneio" que gera o bracket

### 4. Sistema de Partidas (Swiss System)
- Rodada 1: embaralhamento aleatório completo
- Rodadas seguintes: pareamento suíço (mesma pontuação, sem repetição)
- Distribuição automática das partidas pelas arenas ativas

### 5. Tela de Versus / Interface do Juiz ("Pro Arena")
- Visual VS épico 2D: foto circular Player 1 (esquerda) VS Player 2 (direita) com nomes em destaque
- Painel de arenas com abas (Arena A, Arena B...)
- Botões de resultado para cada jogador:
  - "Finish" (Spin/Over/Burst) → pontuação normal
  - "Extreme Finish" → pontuação bônus
- Botão "Confirmar Resultado" → alerta visual de vitória → carrega próxima partida automaticamente

### 6. Rankings / Leaderboard
- Abas: "Top Semanal" e "Top Mensal"
- Ranking calculado por vitórias + tipo de vitória (Extreme Finish vale mais)
- Atualização automática ao confirmar resultados
- Visual com posição, foto, nome, pontuação, W/L ratio

## Persistência
- Todos os dados (jogadores, torneios, rankings, histórico) salvos em LocalStorage
- Estado do torneio preservado ao recarregar a página

## Estrutura de Componentes
- `Dashboard` – tela inicial com resumo e rankings
- `PlayerManager` – CRUD de jogadores
- `TournamentSetup` – configuração e início
- `MatchArena` – tela VS com interface do juiz
- `Leaderboard` – rankings com filtros temporais
- Componentes compartilhados: `PlayerCard`, `VersusScreen`, `ArenaPanel`, `ResultButtons`

