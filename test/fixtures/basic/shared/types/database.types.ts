// Shape emitted by `supabase gen types typescript` for db/seed.sql.
// Regenerate with `nuxt-postgrest types` (needs DATABASE_URL), then keep the db/seed.sql shape.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  internal: {
    Tables: {
      audit_log: {
        Row: { id: number, message: string }
        Insert: { id?: never, message: string }
        Update: { id?: never, message?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
  public: {
    Tables: {
      todos: {
        Row: { id: number, is_public: boolean, owner: string | null, title: string }
        Insert: { id?: never, is_public?: boolean, owner?: string | null, title: string }
        Update: { id?: never, is_public?: boolean, owner?: string | null, title?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
