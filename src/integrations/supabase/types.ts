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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          bilancio_giocate: number
          bilancio_giocate_rapide: number
          conto: string
          created_at: string
          descrizione: string | null
          id: string
          intestatario: string
          saldo_attuale: number
          stato: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          bilancio_giocate?: number
          bilancio_giocate_rapide?: number
          conto: string
          created_at?: string
          descrizione?: string | null
          id?: string
          intestatario: string
          saldo_attuale?: number
          stato: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          bilancio_giocate?: number
          bilancio_giocate_rapide?: number
          conto?: string
          created_at?: string
          descrizione?: string | null
          id?: string
          intestatario?: string
          saldo_attuale?: number
          stato?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bet_legs: {
        Row: {
          bet_id: string
          competizione: string | null
          created_at: string
          data_evento: string
          evento: string
          id: string
          mercato: string | null
          quota: number
          risultato: string | null
          selezione: string
          stato: string
          user_id: string
        }
        Insert: {
          bet_id: string
          competizione?: string | null
          created_at?: string
          data_evento: string
          evento: string
          id?: string
          mercato?: string | null
          quota: number
          risultato?: string | null
          selezione: string
          stato?: string
          user_id: string
        }
        Update: {
          bet_id?: string
          competizione?: string | null
          created_at?: string
          data_evento?: string
          evento?: string
          id?: string
          mercato?: string | null
          quota?: number
          risultato?: string | null
          selezione?: string
          stato?: string
          user_id?: string
        }
        Relationships: []
      }
      bets: {
        Row: {
          bonus: number | null
          competizione: string | null
          conto: string
          created_at: string
          data_evento: string
          evento: string | null
          id: string
          mercato: string | null
          metodo: string | null
          nome_gioco: string | null
          note: string | null
          numero_minimo_selezioni: number | null
          percentuale_bonus: number | null
          quota: number | null
          quota_combinata: number | null
          quota_punta: number | null
          rimborso: number | null
          risultato: number | null
          stake: number
          stato: string
          stato_evento: string | null
          tag: string | null
          tipo: string
          tipo_bonus: string | null
          url_evento: string | null
          user_id: string
          vincita_potenziale: number | null
          wallet_id: string | null
        }
        Insert: {
          bonus?: number | null
          competizione?: string | null
          conto: string
          created_at?: string
          data_evento: string
          evento?: string | null
          id?: string
          mercato?: string | null
          metodo?: string | null
          nome_gioco?: string | null
          note?: string | null
          numero_minimo_selezioni?: number | null
          percentuale_bonus?: number | null
          quota?: number | null
          quota_combinata?: number | null
          quota_punta?: number | null
          rimborso?: number | null
          risultato?: number | null
          stake: number
          stato: string
          stato_evento?: string | null
          tag?: string | null
          tipo: string
          tipo_bonus?: string | null
          url_evento?: string | null
          user_id: string
          vincita_potenziale?: number | null
          wallet_id?: string | null
        }
        Update: {
          bonus?: number | null
          competizione?: string | null
          conto?: string
          created_at?: string
          data_evento?: string
          evento?: string | null
          id?: string
          mercato?: string | null
          metodo?: string | null
          nome_gioco?: string | null
          note?: string | null
          numero_minimo_selezioni?: number | null
          percentuale_bonus?: number | null
          quota?: number | null
          quota_combinata?: number | null
          quota_punta?: number | null
          rimborso?: number | null
          risultato?: number | null
          stake?: number
          stato?: string
          stato_evento?: string | null
          tag?: string | null
          tipo?: string
          tipo_bonus?: string | null
          url_evento?: string | null
          user_id?: string
          vincita_potenziale?: number | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          metodo: string
          nome: string
          predefinito: boolean
          stato: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          metodo?: string
          nome: string
          predefinito?: boolean
          stato?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          metodo?: string
          nome?: string
          predefinito?: boolean
          stato?: string
          user_id?: string
        }
        Relationships: []
      }
      intestatari: {
        Row: {
          created_at: string
          descrizione: string | null
          id: string
          nome: string
          predefinito: boolean
          stato: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descrizione?: string | null
          id?: string
          nome: string
          predefinito?: boolean
          stato?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descrizione?: string | null
          id?: string
          nome?: string
          predefinito?: boolean
          stato?: string
          user_id?: string
        }
        Relationships: []
      }
      lay_bets: {
        Row: {
          conto: string
          created_at: string
          data_evento: string
          evento: string
          id: string
          mercato: string
          metodo: string
          parent_bet_id: string
          quota_banca: number
          quota_punta: number
          stake: number
          tasse_percentuale: number
          url_evento: string | null
          user_id: string
        }
        Insert: {
          conto: string
          created_at?: string
          data_evento: string
          evento: string
          id?: string
          mercato: string
          metodo: string
          parent_bet_id: string
          quota_banca: number
          quota_punta: number
          stake: number
          tasse_percentuale?: number
          url_evento?: string | null
          user_id: string
        }
        Update: {
          conto?: string
          created_at?: string
          data_evento?: string
          evento?: string
          id?: string
          mercato?: string
          metodo?: string
          parent_bet_id?: string
          quota_banca?: number
          quota_punta?: number
          stake?: number
          tasse_percentuale?: number
          url_evento?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lay_bets_parent_bet_id_fkey"
            columns: ["parent_bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          id: string
          reference_id: string
          sent_at: string | null
          type: string
        }
        Insert: {
          id?: string
          reference_id: string
          sent_at?: string | null
          type: string
        }
        Update: {
          id?: string
          reference_id?: string
          sent_at?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          conto: string
          created_at: string
          data_di_scadenza: string
          descrizione: string
          id: string
          metodo: string
          notifica_periodo: string
          stato: string
          user_id: string
        }
        Insert: {
          conto: string
          created_at?: string
          data_di_scadenza: string
          descrizione: string
          id?: string
          metodo: string
          notifica_periodo: string
          stato?: string
          user_id: string
        }
        Update: {
          conto?: string
          created_at?: string
          data_di_scadenza?: string
          descrizione?: string
          id?: string
          metodo?: string
          notifica_periodo?: string
          stato?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          accredito: number | null
          addebito: number | null
          bet_id: string | null
          conto: string
          descrizione: string | null
          id: string
          metodo: string
          registrato: string
          user_id: string
          wallet: string | null
        }
        Insert: {
          account_id?: string | null
          accredito?: number | null
          addebito?: number | null
          bet_id?: string | null
          conto: string
          descrizione?: string | null
          id?: string
          metodo: string
          registrato?: string
          user_id: string
          wallet?: string | null
        }
        Update: {
          account_id?: string | null
          accredito?: number | null
          addebito?: number | null
          bet_id?: string | null
          conto?: string
          descrizione?: string | null
          id?: string
          metodo?: string
          registrato?: string
          user_id?: string
          wallet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_telegram_config: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          descrizione: string | null
          id: string
          intestatario: string
          nome: string
          saldo_attuale: number
          stato: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descrizione?: string | null
          id?: string
          intestatario: string
          nome: string
          saldo_attuale?: number
          stato: string
          user_id: string
        }
        Update: {
          created_at?: string
          descrizione?: string | null
          id?: string
          intestatario?: string
          nome?: string
          saldo_attuale?: number
          stato?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_public_book_to_user: {
        Args: { _book_metodo: string; _book_nome: string }
        Returns: string
      }
      admin_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      admin_get_registration_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          date: string
        }[]
      }
      admin_get_user_activities: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_count: number
          bet_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          transaction_count: number
          wallet_count: number
        }[]
      }
      admin_get_user_earnings: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          full_name: string
          total_earnings: number
          user_id: string
        }[]
      }
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_telegram_message: {
        Args: { message: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "free"
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
      app_role: ["admin", "free"],
    },
  },
} as const
