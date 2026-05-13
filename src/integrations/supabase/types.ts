export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      amizades: {
        Row: {
          created_at: string | null
          destinatario_id: string | null
          id: string
          solicitante_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          destinatario_id?: string | null
          id?: string
          solicitante_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          destinatario_id?: string | null
          id?: string
          solicitante_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bey_assist_blades: {
        Row: {
          created_at: string | null
          id: number
          imagem_url: string | null
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          imagem_url?: string | null
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: number
          imagem_url?: string | null
          nome?: string
        }
        Relationships: []
      }
      bey_bits: {
        Row: {
          abreviacao: string | null
          atk: number | null
          br: number | null
          burst_resist: string | null
          created_at: string | null
          dash_performance: string | null
          def: number | null
          endr: number | null
          id: number
          imagem_url: string | null
          linha: string | null
          nome: string
          tipo: string | null
          xdash: number | null
        }
        Insert: {
          abreviacao?: string | null
          atk?: number | null
          br?: number | null
          burst_resist?: string | null
          created_at?: string | null
          dash_performance?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          linha?: string | null
          nome: string
          tipo?: string | null
          xdash?: number | null
        }
        Update: {
          abreviacao?: string | null
          atk?: number | null
          br?: number | null
          burst_resist?: string | null
          created_at?: string | null
          dash_performance?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          linha?: string | null
          nome?: string
          tipo?: string | null
          xdash?: number | null
        }
        Relationships: []
      }
      bey_blades: {
        Row: {
          atk: number | null
          br: number | null
          created_at: string | null
          def: number | null
          endr: number | null
          id: number
          imagem_url: string | null
          linha: string
          nome: string
          peso_g: number | null
          spin: string | null
          tipo_ataque: string | null
          xdash: number | null
        }
        Insert: {
          atk?: number | null
          br?: number | null
          created_at?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          linha: string
          nome: string
          peso_g?: number | null
          spin?: string | null
          tipo_ataque?: string | null
          xdash?: number | null
        }
        Update: {
          atk?: number | null
          br?: number | null
          created_at?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          linha?: string
          nome?: string
          peso_g?: number | null
          spin?: string | null
          tipo_ataque?: string | null
          xdash?: number | null
        }
        Relationships: []
      }
      bey_combos: {
        Row: {
          assist_blade_id: number | null
          atk_total: number | null
          bit_id: number | null
          blade_id: number | null
          br_total: number | null
          created_at: string | null
          deck_uuid: string
          def_total: number | null
          endr_total: number | null
          id: string
          linha: string
          lock_chip_id: number | null
          main_blade_id: number | null
          nome: string
          ratchet_id: number | null
          slot: number
          updated_at: string | null
          user_id: string
          xdash_total: number | null
        }
        Insert: {
          assist_blade_id?: number | null
          atk_total?: number | null
          bit_id?: number | null
          blade_id?: number | null
          br_total?: number | null
          created_at?: string | null
          deck_uuid?: string
          def_total?: number | null
          endr_total?: number | null
          id?: string
          linha: string
          lock_chip_id?: number | null
          main_blade_id?: number | null
          nome?: string
          ratchet_id?: number | null
          slot: number
          updated_at?: string | null
          user_id: string
          xdash_total?: number | null
        }
        Update: {
          assist_blade_id?: number | null
          atk_total?: number | null
          bit_id?: number | null
          blade_id?: number | null
          br_total?: number | null
          created_at?: string | null
          deck_uuid?: string
          def_total?: number | null
          endr_total?: number | null
          id?: string
          linha?: string
          lock_chip_id?: number | null
          main_blade_id?: number | null
          nome?: string
          ratchet_id?: number | null
          slot?: number
          updated_at?: string | null
          user_id?: string
          xdash_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bey_combos_assist_blade_id_fkey"
            columns: ["assist_blade_id"]
            isOneToOne: false
            referencedRelation: "bey_assist_blades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_combos_bit_id_fkey"
            columns: ["bit_id"]
            isOneToOne: false
            referencedRelation: "bey_bits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_combos_blade_id_fkey"
            columns: ["blade_id"]
            isOneToOne: false
            referencedRelation: "bey_blades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_combos_lock_chip_id_fkey"
            columns: ["lock_chip_id"]
            isOneToOne: false
            referencedRelation: "bey_lock_chips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_combos_main_blade_id_fkey"
            columns: ["main_blade_id"]
            isOneToOne: false
            referencedRelation: "bey_main_blades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bey_combos_ratchet_id_fkey"
            columns: ["ratchet_id"]
            isOneToOne: false
            referencedRelation: "bey_ratchets"
            referencedColumns: ["id"]
          },
        ]
      }
      bey_lock_chips: {
        Row: {
          created_at: string | null
          id: number
          imagem_url: string | null
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          imagem_url?: string | null
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: number
          imagem_url?: string | null
          nome?: string
        }
        Relationships: []
      }
      bey_main_blades: {
        Row: {
          atk: number | null
          created_at: string | null
          def: number | null
          endr: number | null
          id: number
          imagem_url: string | null
          nome: string
          tipo_ataque: string | null
        }
        Insert: {
          atk?: number | null
          created_at?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          nome: string
          tipo_ataque?: string | null
        }
        Update: {
          atk?: number | null
          created_at?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          nome?: string
          tipo_ataque?: string | null
        }
        Relationships: []
      }
      bey_ratchets: {
        Row: {
          altura: number | null
          atk: number | null
          created_at: string | null
          def: number | null
          endr: number | null
          id: number
          imagem_url: string | null
          lados: number | null
          linha: string | null
          nome: string
        }
        Insert: {
          altura?: number | null
          atk?: number | null
          created_at?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          lados?: number | null
          linha?: string | null
          nome: string
        }
        Update: {
          altura?: number | null
          atk?: number | null
          created_at?: string | null
          def?: number | null
          endr?: number | null
          id?: number
          imagem_url?: string | null
          lados?: number | null
          linha?: string | null
          nome?: string
        }
        Relationships: []
      }
      beyblades_meta: {
        Row: {
          ativo: boolean | null
          bit: string
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          id: string
          imagem_url: string | null
          nome: string
          ordem: number | null
          ratchet: string
          tier: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bit: string
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number | null
          ratchet: string
          tier: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bit?: string
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number | null
          ratchet?: string
          tier?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bladers_temp: {
        Row: {
          apelido: string | null
          avatar_url: string | null
          beyblade_favorita: string | null
          cidade: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          organizador_id: string
          telefone: string | null
          vinculado_a: string | null
          vinculado_em: string | null
        }
        Insert: {
          apelido?: string | null
          avatar_url?: string | null
          beyblade_favorita?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          organizador_id: string
          telefone?: string | null
          vinculado_a?: string | null
          vinculado_em?: string | null
        }
        Update: {
          apelido?: string | null
          avatar_url?: string | null
          beyblade_favorita?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          organizador_id?: string
          telefone?: string | null
          vinculado_a?: string | null
          vinculado_em?: string | null
        }
        Relationships: []
      }
      conquistas_bladers: {
        Row: {
          concluida: boolean | null
          concluida_em: string | null
          conquista_id: number | null
          id: string
          notificado: boolean | null
          progresso: number | null
          user_id: string | null
        }
        Insert: {
          concluida?: boolean | null
          concluida_em?: string | null
          conquista_id?: number | null
          id?: string
          notificado?: boolean | null
          progresso?: number | null
          user_id?: string | null
        }
        Update: {
          concluida?: boolean | null
          concluida_em?: string | null
          conquista_id?: number | null
          id?: string
          notificado?: boolean | null
          progresso?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conquistas_bladers_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "conquistas_definicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conquistas_definicoes: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: number
          meta: number | null
          nome: string
          slug: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: number
          meta?: number | null
          nome: string
          slug: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: number
          meta?: number | null
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      elo_bladers: {
        Row: {
          created_at: string | null
          elo: string | null
          em_promocao: boolean | null
          id: string
          pontos: number | null
          promocao_derrotas: number | null
          promocao_vitorias: number | null
          temporada_id: string | null
          titulo_final: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          elo?: string | null
          em_promocao?: boolean | null
          id?: string
          pontos?: number | null
          promocao_derrotas?: number | null
          promocao_vitorias?: number | null
          temporada_id?: string | null
          titulo_final?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          elo?: string | null
          em_promocao?: boolean | null
          id?: string
          pontos?: number | null
          promocao_derrotas?: number | null
          promocao_vitorias?: number | null
          temporada_id?: string | null
          titulo_final?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elo_bladers_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_atividades: {
        Row: {
          created_at: string | null
          dados: Json | null
          id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      historico_elo: {
        Row: {
          created_at: string | null
          id: string
          motivo: string | null
          pontos_antes: number | null
          pontos_depois: number | null
          temporada_id: string | null
          torneio_id: string | null
          user_id: string | null
          variacao: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          motivo?: string | null
          pontos_antes?: number | null
          pontos_depois?: number | null
          temporada_id?: string | null
          torneio_id?: string | null
          user_id?: string | null
          variacao?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          motivo?: string | null
          pontos_antes?: number | null
          pontos_depois?: number | null
          temporada_id?: string | null
          torneio_id?: string | null
          user_id?: string | null
          variacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_elo_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_elo_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes: {
        Row: {
          blader_id: string | null
          blader_temp_id: string | null
          deck_id: string | null
          deck_snapshot: Json | null
          derrotas: number
          id: string
          inscrito_em: string
          posicao_final: number | null
          status: string
          streak_max: number
          torneio_id: string
          vitorias: number
          xp_ganho: number
        }
        Insert: {
          blader_id?: string | null
          blader_temp_id?: string | null
          deck_id?: string | null
          deck_snapshot?: Json | null
          derrotas?: number
          id?: string
          inscrito_em?: string
          posicao_final?: number | null
          status?: string
          streak_max?: number
          torneio_id: string
          vitorias?: number
          xp_ganho?: number
        }
        Update: {
          blader_id?: string | null
          blader_temp_id?: string | null
          deck_id?: string | null
          deck_snapshot?: Json | null
          derrotas?: number
          id?: string
          inscrito_em?: string
          posicao_final?: number | null
          status?: string
          streak_max?: number
          torneio_id?: string
          vitorias?: number
          xp_ganho?: number
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_blader_id_fkey"
            columns: ["blader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_blader_temp_id_fkey"
            columns: ["blader_temp_id"]
            isOneToOne: false
            referencedRelation: "bladers_temp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_torneio_id_fkey"
            columns: ["torneio_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          dados: Json | null
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dados?: Json | null
          id?: string
          lida?: boolean
          mensagem: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          dados?: Json | null
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          extreme_finish_wins: number
          finish_wins: number
          id: string
          liga_id: string | null
          losses: number
          month_key: string
          player_id: string
          points: number
          week_key: string
          wins: number
        }
        Insert: {
          extreme_finish_wins?: number
          finish_wins?: number
          id?: string
          liga_id?: string | null
          losses?: number
          month_key: string
          player_id: string
          points?: number
          week_key: string
          wins?: number
        }
        Update: {
          extreme_finish_wins?: number
          finish_wins?: number
          id?: string
          liga_id?: string | null
          losses?: number
          month_key?: string
          player_id?: string
          points?: number
          week_key?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar: string
          created_at: string
          id: string
          liga_id: string | null
          name: string
          nickname: string
          xp: number
        }
        Insert: {
          avatar?: string
          created_at?: string
          id?: string
          liga_id?: string | null
          name: string
          nickname?: string
          xp?: number
        }
        Update: {
          avatar?: string
          created_at?: string
          id?: string
          liga_id?: string | null
          name?: string
          nickname?: string
          xp?: number
        }
        Relationships: []
      }
      presenca_online: {
        Row: {
          online: boolean | null
          ultimo_visto: string | null
          user_id: string
        }
        Insert: {
          online?: boolean | null
          ultimo_visto?: string | null
          user_id: string
        }
        Update: {
          online?: boolean | null
          ultimo_visto?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_blader_url: string | null
          avatar_url: string | null
          beyblade_favorita: string | null
          bio: string | null
          bio_blader: string | null
          cidade: string | null
          cidade_blader: string | null
          cor_perfil: string
          created_at: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          estado_blader: string | null
          id: string
          logo_url: string | null
          match_verificado: boolean
          melhor_posicao: number | null
          nivel: string
          nome_blader: string | null
          nome_liga: string | null
          streak_max: number
          tem_perfil_blader: boolean
          tem_perfil_organizador: boolean
          tipo_conta: string
          torneios_total: number
          updated_at: string | null
          vitorias_total: number
          xp_total: number
        }
        Insert: {
          avatar_blader_url?: string | null
          avatar_url?: string | null
          beyblade_favorita?: string | null
          bio?: string | null
          bio_blader?: string | null
          cidade?: string | null
          cidade_blader?: string | null
          cor_perfil?: string
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          estado_blader?: string | null
          id: string
          logo_url?: string | null
          match_verificado?: boolean
          melhor_posicao?: number | null
          nivel?: string
          nome_blader?: string | null
          nome_liga?: string | null
          streak_max?: number
          tem_perfil_blader?: boolean
          tem_perfil_organizador?: boolean
          tipo_conta?: string
          torneios_total?: number
          updated_at?: string | null
          vitorias_total?: number
          xp_total?: number
        }
        Update: {
          avatar_blader_url?: string | null
          avatar_url?: string | null
          beyblade_favorita?: string | null
          bio?: string | null
          bio_blader?: string | null
          cidade?: string | null
          cidade_blader?: string | null
          cor_perfil?: string
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          estado_blader?: string | null
          id?: string
          logo_url?: string | null
          match_verificado?: boolean
          melhor_posicao?: number | null
          nivel?: string
          nome_blader?: string | null
          nome_liga?: string | null
          streak_max?: number
          tem_perfil_blader?: boolean
          tem_perfil_organizador?: boolean
          tipo_conta?: string
          torneios_total?: number
          updated_at?: string | null
          vitorias_total?: number
          xp_total?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          prefs: Json | null
          subscription: Json
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prefs?: Json | null
          subscription: Json
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prefs?: Json | null
          subscription?: Json
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      release_notes: {
        Row: {
          created_at: string | null
          data: string
          descricao: string
          id: string
          publicado: boolean | null
          tag: string
          titulo: string
          versao: string
        }
        Insert: {
          created_at?: string | null
          data?: string
          descricao: string
          id?: string
          publicado?: boolean | null
          tag: string
          titulo: string
          versao: string
        }
        Update: {
          created_at?: string | null
          data?: string
          descricao?: string
          id?: string
          publicado?: boolean | null
          tag?: string
          titulo?: string
          versao?: string
        }
        Relationships: []
      }
      temporadas: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          fim: string
          id: string
          inicio: string
          nome: string
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          fim: string
          id?: string
          inicio: string
          nome: string
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          fim?: string
          id?: string
          inicio?: string
          nome?: string
        }
        Relationships: []
      }
      torre_x_desafios: {
        Row: {
          cidade: string | null
          confirmado_desafiado: boolean | null
          confirmado_desafiante: boolean | null
          created_at: string | null
          desafiado_id: string | null
          desafiante_id: string | null
          id: string
          pontos_em_jogo: number | null
          score_desafiado: number | null
          score_desafiante: number | null
          status: string | null
          updated_at: string | null
          vencedor_id: string | null
        }
        Insert: {
          cidade?: string | null
          confirmado_desafiado?: boolean | null
          confirmado_desafiante?: boolean | null
          created_at?: string | null
          desafiado_id?: string | null
          desafiante_id?: string | null
          id?: string
          pontos_em_jogo?: number | null
          score_desafiado?: number | null
          score_desafiante?: number | null
          status?: string | null
          updated_at?: string | null
          vencedor_id?: string | null
        }
        Update: {
          cidade?: string | null
          confirmado_desafiado?: boolean | null
          confirmado_desafiante?: boolean | null
          created_at?: string | null
          desafiado_id?: string | null
          desafiante_id?: string | null
          id?: string
          pontos_em_jogo?: number | null
          score_desafiado?: number | null
          score_desafiante?: number | null
          status?: string | null
          updated_at?: string | null
          vencedor_id?: string | null
        }
        Relationships: []
      }
      torre_x_historico: {
        Row: {
          andar_antes: number | null
          andar_depois: number | null
          created_at: string | null
          desafio_id: string | null
          id: string
          oponente_id: string | null
          pontos_antes: number | null
          pontos_depois: number | null
          resultado: string | null
          user_id: string | null
          variacao: number | null
        }
        Insert: {
          andar_antes?: number | null
          andar_depois?: number | null
          created_at?: string | null
          desafio_id?: string | null
          id?: string
          oponente_id?: string | null
          pontos_antes?: number | null
          pontos_depois?: number | null
          resultado?: string | null
          user_id?: string | null
          variacao?: number | null
        }
        Update: {
          andar_antes?: number | null
          andar_depois?: number | null
          created_at?: string | null
          desafio_id?: string | null
          id?: string
          oponente_id?: string | null
          pontos_antes?: number | null
          pontos_depois?: number | null
          resultado?: string | null
          user_id?: string | null
          variacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "torre_x_historico_desafio_id_fkey"
            columns: ["desafio_id"]
            isOneToOne: false
            referencedRelation: "torre_x_desafios"
            referencedColumns: ["id"]
          },
        ]
      }
      torre_x_pontos: {
        Row: {
          andar: number | null
          cidade: string | null
          created_at: string | null
          estado: string | null
          id: string
          pontos: number | null
          rejeicoes_seguidas: number | null
          tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          andar?: number | null
          cidade?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          pontos?: number | null
          rejeicoes_seguidas?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          andar?: number | null
          cidade?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          pontos?: number | null
          rejeicoes_seguidas?: number | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          arena_count: number
          created_at: string
          current_round: number
          date: string
          descricao: string | null
          final_standings: Json | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          imagem_url: string | null
          liga_id: string | null
          local_cidade: string | null
          local_endereco: string | null
          local_estado: string | null
          local_nome: string | null
          max_players: number | null
          name: string
          player_ids: string[]
          points_to_win: number
          premio: string | null
          regras: string | null
          rounds: Json
          signup_deadline: string
          status: string
          total_rounds: number
        }
        Insert: {
          arena_count?: number
          created_at?: string
          current_round?: number
          date: string
          descricao?: string | null
          final_standings?: Json | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          imagem_url?: string | null
          liga_id?: string | null
          local_cidade?: string | null
          local_endereco?: string | null
          local_estado?: string | null
          local_nome?: string | null
          max_players?: number | null
          name: string
          player_ids?: string[]
          points_to_win?: number
          premio?: string | null
          regras?: string | null
          rounds?: Json
          signup_deadline?: string
          status?: string
          total_rounds?: number
        }
        Update: {
          arena_count?: number
          created_at?: string
          current_round?: number
          date?: string
          descricao?: string | null
          final_standings?: Json | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          imagem_url?: string | null
          liga_id?: string | null
          local_cidade?: string | null
          local_endereco?: string | null
          local_estado?: string | null
          local_nome?: string | null
          max_players?: number | null
          name?: string
          player_ids?: string[]
          points_to_win?: number
          premio?: string | null
          regras?: string | null
          rounds?: Json
          signup_deadline?: string
          status?: string
          total_rounds?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_tournament_results: {
        Args: { _standings: Json; _torneio_id: string }
        Returns: undefined
      }
      calcular_nivel_blader: { Args: { _xp: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_bladers_temp: {
        Args: { _temp_ids: string[]; _user_id: string }
        Returns: undefined
      }
      match_bladers_temp_by_email: {
        Args: { _email: string; _user_id: string }
        Returns: number
      }
      rebuild_tournament_results_from_rounds: {
        Args: { _torneio_id: string }
        Returns: Json
      }
      recompute_blader_metrics: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "organizer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "organizer"],
    },
  },
} as const
