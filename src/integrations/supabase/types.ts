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
      profiles: {
        Row: {
          cidade: string | null
          created_at: string | null
          descricao: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome_liga: string | null
          updated_at: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          id: string
          logo_url?: string | null
          nome_liga?: string | null
          updated_at?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome_liga?: string | null
          updated_at?: string | null
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
      tournaments: {
        Row: {
          arena_count: number
          created_at: string
          current_round: number
          date: string
          final_standings: Json | null
          id: string
          liga_id: string | null
          max_players: number | null
          name: string
          player_ids: string[]
          points_to_win: number
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
          final_standings?: Json | null
          id?: string
          liga_id?: string | null
          max_players?: number | null
          name: string
          player_ids?: string[]
          points_to_win?: number
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
          final_standings?: Json | null
          id?: string
          liga_id?: string | null
          max_players?: number | null
          name?: string
          player_ids?: string[]
          points_to_win?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
