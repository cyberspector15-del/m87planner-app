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
      activity_logs: {
        Row: {
          event_id: string | null
          id: string
          logged_at: string
          notes: string | null
          outcome: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          logged_at?: string
          notes?: string | null
          outcome: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          event_id?: string | null
          id?: string
          logged_at?: string
          notes?: string | null
          outcome?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          status: string | null
          task_id: string | null
          title: string
          travel_buffer_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          status?: string | null
          task_id?: string | null
          title: string
          travel_buffer_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          status?: string | null
          task_id?: string | null
          title?: string
          travel_buffer_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_commands_reset_date: string | null
          ai_commands_used_today: number | null
          ai_strictness: string | null
          ask_before_reschedule: boolean | null
          auto_carry_tasks: boolean | null
          commute_tolerance_minutes: number | null
          conversation_mode_enabled: boolean | null
          created_at: string
          email: string | null
          focus_hours_end: string | null
          focus_hours_start: string | null
          haptic_enabled: boolean | null
          id: string
          name: string | null
          notifications_enabled: boolean | null
          omv_balance: number | null
          planning_mode: string | null
          referral_code: string | null
          referred_by: string | null
          reminder_minutes: number | null
          show_ai_explanations: boolean | null
          sound_enabled: boolean | null
          subscription_tier: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          work_hours_end: string | null
          work_hours_start: string | null
        }
        Insert: {
          ai_commands_reset_date?: string | null
          ai_commands_used_today?: number | null
          ai_strictness?: string | null
          ask_before_reschedule?: boolean | null
          auto_carry_tasks?: boolean | null
          commute_tolerance_minutes?: number | null
          conversation_mode_enabled?: boolean | null
          created_at?: string
          email?: string | null
          focus_hours_end?: string | null
          focus_hours_start?: string | null
          haptic_enabled?: boolean | null
          id?: string
          name?: string | null
          notifications_enabled?: boolean | null
          omv_balance?: number | null
          planning_mode?: string | null
          referral_code?: string | null
          referred_by?: string | null
          reminder_minutes?: number | null
          show_ai_explanations?: boolean | null
          sound_enabled?: boolean | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Update: {
          ai_commands_reset_date?: string | null
          ai_commands_used_today?: number | null
          ai_strictness?: string | null
          ask_before_reschedule?: boolean | null
          auto_carry_tasks?: boolean | null
          commute_tolerance_minutes?: number | null
          conversation_mode_enabled?: boolean | null
          created_at?: string
          email?: string | null
          focus_hours_end?: string | null
          focus_hours_start?: string | null
          haptic_enabled?: boolean | null
          id?: string
          name?: string | null
          notifications_enabled?: boolean | null
          omv_balance?: number | null
          planning_mode?: string | null
          referral_code?: string | null
          referred_by?: string | null
          reminder_minutes?: number | null
          show_ai_explanations?: boolean | null
          sound_enabled?: boolean | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          target_duration_minutes: number | null
          title: string
          updated_at: string
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          target_duration_minutes?: number | null
          title: string
          updated_at?: string
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          target_duration_minutes?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          deadline: string | null
          description: string | null
          duration_minutes: number | null
          flexible: boolean | null
          id: string
          location: string | null
          priority: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration_minutes?: number | null
          flexible?: boolean | null
          id?: string
          location?: string | null
          priority?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration_minutes?: number | null
          flexible?: boolean | null
          id?: string
          location?: string | null
          priority?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_task_and_award_omv: {
        Args: { p_completed: boolean; p_task_id: string }
        Returns: Database["public"]["Tables"]["tasks"]["Row"]
      }
      get_ai_usage_status: { Args: { p_user_id: string }; Returns: Json }
      increment_ai_usage: { Args: { p_user_id: string }; Returns: Json }
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
