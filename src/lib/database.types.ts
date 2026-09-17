// Generated from the hosted Supabase schema. Regenerate after every migration:
//   npx supabase gen types typescript --project-id ezdmzygqkegevlzbmnko > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      expense_splits: {
        Row: { amount: number; expense_id: string; id: string; percentage: number | null; share: number | null; user_id: string }
        Insert: { amount: number; expense_id: string; id?: string; percentage?: number | null; share?: number | null; user_id: string }
        Update: { amount?: number; expense_id?: string; id?: string; percentage?: number | null; share?: number | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "expense_splits_expense_id_fkey"; columns: ["expense_id"]; isOneToOne: false; referencedRelation: "expenses"; referencedColumns: ["id"] },
          { foreignKeyName: "expense_splits_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "household_members"; referencedColumns: ["id"] },
        ]
      }
      expenses: {
        Row: { amount: number; created_at: string; created_by: string | null; currency: string; description: string | null; expense_date: string; household_id: string; id: string; paid_by: string; title: string; updated_at: string }
        Insert: { amount: number; created_at?: string; created_by?: string | null; currency?: string; description?: string | null; expense_date?: string; household_id: string; id?: string; paid_by: string; title: string; updated_at?: string }
        Update: { amount?: number; created_at?: string; created_by?: string | null; currency?: string; description?: string | null; expense_date?: string; household_id?: string; id?: string; paid_by?: string; title?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "expenses_household_id_fkey"; columns: ["household_id"]; isOneToOne: false; referencedRelation: "households"; referencedColumns: ["id"] },
          { foreignKeyName: "expenses_paid_by_fkey"; columns: ["paid_by"]; isOneToOne: false; referencedRelation: "household_members"; referencedColumns: ["id"] },
        ]
      }
      household_members: {
        Row: { created_at: string; household_id: string; id: string; name: string; role: string; user_id: string | null }
        Insert: { created_at?: string; household_id: string; id?: string; name: string; role?: string; user_id?: string | null }
        Update: { created_at?: string; household_id?: string; id?: string; name?: string; role?: string; user_id?: string | null }
        Relationships: [
          { foreignKeyName: "members_household_id_fkey"; columns: ["household_id"]; isOneToOne: false; referencedRelation: "households"; referencedColumns: ["id"] },
        ]
      }
      households: {
        Row: { created_at: string; currency: string; id: string; invite_code: string; name: string; timezone: string }
        Insert: { created_at?: string; currency?: string; id?: string; invite_code: string; name: string; timezone?: string }
        Update: { created_at?: string; currency?: string; id?: string; invite_code?: string; name?: string; timezone?: string }
        Relationships: []
      }
      settlements: {
        Row: { amount: number; created_at: string; from_user: string; household_id: string; id: string; settled_at: string | null; status: string; to_user: string }
        Insert: { amount: number; created_at?: string; from_user: string; household_id: string; id?: string; settled_at?: string | null; status?: string; to_user: string }
        Update: { amount?: number; created_at?: string; from_user?: string; household_id?: string; id?: string; settled_at?: string | null; status?: string; to_user?: string }
        Relationships: [
          { foreignKeyName: "settlements_from_user_fkey"; columns: ["from_user"]; isOneToOne: false; referencedRelation: "household_members"; referencedColumns: ["id"] },
          { foreignKeyName: "settlements_household_id_fkey"; columns: ["household_id"]; isOneToOne: false; referencedRelation: "households"; referencedColumns: ["id"] },
          { foreignKeyName: "settlements_to_user_fkey"; columns: ["to_user"]; isOneToOne: false; referencedRelation: "household_members"; referencedColumns: ["id"] },
        ]
      }
      shopping_items: {
        Row: { category: string | null; completed_at: string | null; completed_by: string | null; created_at: string; created_by: string | null; id: string; image_url: string | null; name: string; note: string | null; position: number; quantity: number | null; shopping_list_id: string; unit: string | null; updated_at: string }
        Insert: { category?: string | null; completed_at?: string | null; completed_by?: string | null; created_at?: string; created_by?: string | null; id?: string; image_url?: string | null; name: string; note?: string | null; position?: number; quantity?: number | null; shopping_list_id: string; unit?: string | null; updated_at?: string }
        Update: { category?: string | null; completed_at?: string | null; completed_by?: string | null; created_at?: string; created_by?: string | null; id?: string; image_url?: string | null; name?: string; note?: string | null; position?: number; quantity?: number | null; shopping_list_id?: string; unit?: string | null; updated_at?: string }
        Relationships: [
          { foreignKeyName: "shopping_items_shopping_list_id_fkey"; columns: ["shopping_list_id"]; isOneToOne: false; referencedRelation: "shopping_lists"; referencedColumns: ["id"] },
        ]
      }
      shopping_lists: {
        Row: { created_at: string; created_by: string | null; household_id: string; id: string; name: string }
        Insert: { created_at?: string; created_by?: string | null; household_id: string; id?: string; name: string }
        Update: { created_at?: string; created_by?: string | null; household_id?: string; id?: string; name?: string }
        Relationships: [
          { foreignKeyName: "shopping_lists_household_id_fkey"; columns: ["household_id"]; isOneToOne: false; referencedRelation: "households"; referencedColumns: ["id"] },
        ]
      }
      task_completions: {
        Row: { completed_at: string; id: string; points_earned: number; task_id: string; user_id: string }
        Insert: { completed_at?: string; id?: string; points_earned?: number; task_id: string; user_id: string }
        Update: { completed_at?: string; id?: string; points_earned?: number; task_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "task_completions_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] },
        ]
      }
      tasks: {
        Row: { created_at: string; description: string | null; done: boolean; due_date: string | null; holder_ids: string[]; holder_index: number; household_id: string; id: string; kind: string; last_done_at: string | null; last_done_by: string | null; points: number; priority: string; repeat: string; repeat_interval: number; rotate: boolean; title: string; updated_at: string }
        Insert: { created_at?: string; description?: string | null; done?: boolean; due_date?: string | null; holder_ids?: string[]; holder_index?: number; household_id: string; id?: string; kind: string; last_done_at?: string | null; last_done_by?: string | null; points?: number; priority?: string; repeat?: string; repeat_interval?: number; rotate?: boolean; title: string; updated_at?: string }
        Update: { created_at?: string; description?: string | null; done?: boolean; due_date?: string | null; holder_ids?: string[]; holder_index?: number; household_id?: string; id?: string; kind?: string; last_done_at?: string | null; last_done_by?: string | null; points?: number; priority?: string; repeat?: string; repeat_interval?: number; rotate?: boolean; title?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "chores_household_id_fkey"; columns: ["household_id"]; isOneToOne: false; referencedRelation: "households"; referencedColumns: ["id"] },
          { foreignKeyName: "chores_last_done_by_fkey"; columns: ["last_done_by"]; isOneToOne: false; referencedRelation: "household_members"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      add_household_member: { Args: { p_household_id: string; p_name: string }; Returns: string }
      calculate_balances: { Args: { p_household_id: string }; Returns: { balance: number; member_id: string; member_name: string }[] }
      change_member_role: { Args: { p_member_id: string; p_role: string }; Returns: undefined }
      complete_task: { Args: { p_task_id: string }; Returns: Database["public"]["Tables"]["tasks"]["Row"] }
      convert_shopping_to_expense: { Args: { p_amount: number; p_list_id: string; p_paid_by: string; p_participant_ids: string[]; p_title: string }; Returns: string }
      create_expense: { Args: { p_amount: number; p_description?: string; p_expense_date?: string; p_household_id: string; p_paid_by: string; p_participant_ids: string[]; p_title: string }; Returns: string }
      create_household: { Args: { p_member_names: string[]; p_name: string }; Returns: { household_id: string; invite_code: string; member_id: string }[] }
      is_household_member: { Args: { p_household_id: string; p_user_id: string }; Returns: boolean }
      join_household: { Args: { p_code: string; p_member_id: string }; Returns: string }
      leave_household: { Args: never; Returns: undefined }
      list_members_by_invite: { Args: { p_code: string }; Returns: { claimed: boolean; id: string; name: string }[] }
      lookup_household_by_invite: { Args: { p_code: string }; Returns: { id: string; invite_code: string; name: string }[] }
      remove_household_member: { Args: { p_member_id: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
