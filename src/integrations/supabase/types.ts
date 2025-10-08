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
          quota: number | null
          quota_punta: number | null
          rimborso: number | null
          risultato: number | null
          stake: number
          stato: string
          tag: string | null
          tipo: string
          tipo_bonus: string | null
          url_evento: string | null
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
          quota?: number | null
          quota_punta?: number | null
          rimborso?: number | null
          risultato?: number | null
          stake: number
          stato: string
          tag?: string | null
          tipo: string
          tipo_bonus?: string | null
          url_evento?: string | null
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
          quota?: number | null
          quota_punta?: number | null
          rimborso?: number | null
          risultato?: number | null
          stake?: number
          stato?: string
          tag?: string | null
          tipo?: string
          tipo_bonus?: string | null
          url_evento?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          created_at: string
          id: string
          metodo: string
          nome: string
          stato: string
        }
        Insert: {
          created_at?: string
          id?: string
          metodo?: string
          nome: string
          stato?: string
        }
        Update: {
          created_at?: string
          id?: string
          metodo?: string
          nome?: string
          stato?: string
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
        }
        Insert: {
          created_at?: string
          descrizione?: string | null
          id?: string
          nome: string
          predefinito?: boolean
          stato?: string
        }
        Update: {
          created_at?: string
          descrizione?: string | null
          id?: string
          nome?: string
          predefinito?: boolean
          stato?: string
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
        }
        Relationships: []
      }
      transactions: {
        Row: {
          accredito: number | null
          addebito: number | null
          conto: string
          descrizione: string | null
          id: string
          metodo: string
          registrato: string
          wallet: string | null
        }
        Insert: {
          accredito?: number | null
          addebito?: number | null
          conto: string
          descrizione?: string | null
          id?: string
          metodo: string
          registrato?: string
          wallet?: string | null
        }
        Update: {
          accredito?: number | null
          addebito?: number | null
          conto?: string
          descrizione?: string | null
          id?: string
          metodo?: string
          registrato?: string
          wallet?: string | null
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
        }
        Insert: {
          created_at?: string
          descrizione?: string | null
          id?: string
          intestatario: string
          nome: string
          saldo_attuale?: number
          stato: string
        }
        Update: {
          created_at?: string
          descrizione?: string | null
          id?: string
          intestatario?: string
          nome?: string
          saldo_attuale?: number
          stato?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
