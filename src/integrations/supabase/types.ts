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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_votes: {
        Row: {
          activity_id: string
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_votes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bring_items: {
        Row: {
          created_at: string | null
          created_by: string
          emoji: string | null
          event_id: string
          id: string
          is_suggestion: boolean | null
          max_quantity: number
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          emoji?: string | null
          event_id: string
          id?: string
          is_suggestion?: boolean | null
          max_quantity?: number
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          emoji?: string | null
          event_id?: string
          id?: string
          is_suggestion?: boolean | null
          max_quantity?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bring_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_user_timeline: {
        Row: {
          created_at: string
          dress_up_time: string | null
          event_id: string
          id: string
          travel_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dress_up_time?: string | null
          event_id: string
          id?: string
          travel_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dress_up_time?: string | null
          event_id?: string
          id?: string
          travel_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_user_timeline_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          finalized_activity: string | null
          finalized_date: string | null
          finalized_slot_id: string | null
          group_id: string
          id: string
          name: string
          packed_up: boolean
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          finalized_activity?: string | null
          finalized_date?: string | null
          finalized_slot_id?: string | null
          group_id: string
          id?: string
          name?: string
          packed_up?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          finalized_activity?: string | null
          finalized_date?: string | null
          finalized_slot_id?: string | null
          group_id?: string
          id?: string
          name?: string
          packed_up?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_finalized_slot_id_fkey"
            columns: ["finalized_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          max_members: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          max_members?: number
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          max_members?: number
          name?: string
        }
        Relationships: []
      }
      item_claims: {
        Row: {
          claimed_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "bring_items"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slot_votes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          time_slot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          time_slot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          time_slot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slot_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_slot_votes_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          slot_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          slot_at: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          slot_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_group: { Args: { group_id_input: string }; Returns: boolean }
      can_view_event: { Args: { event_id_input: string }; Returns: boolean }
      can_view_group_members: {
        Args: { group_id_input: string }
        Returns: boolean
      }
      cleanup_expired_events: { Args: never; Returns: number }
      get_event_group_id: { Args: { event_id_input: string }; Returns: string }
      get_item_group_id: { Args: { item_id_input: string }; Returns: string }
      is_event_creator: { Args: { event_id_input: string }; Returns: boolean }
      is_group_owner: { Args: { group_id_input: string }; Returns: boolean }
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
