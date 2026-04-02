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
      admin_todos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          linked_contact_id: string | null
          linked_ticket_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          linked_contact_id?: string | null
          linked_ticket_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          linked_contact_id?: string | null
          linked_ticket_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_todos_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_todos_linked_ticket_id_fkey"
            columns: ["linked_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      chronicle_events: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          end_sort_value: number | null
          event_date: string
          event_type: string
          icon: string | null
          id: string
          layer: string | null
          linked_entry_id: string | null
          parent_id: string | null
          sort_value: number
          tags: string[] | null
          title: string
          updated_at: string
          world_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_sort_value?: number | null
          event_date: string
          event_type?: string
          icon?: string | null
          id?: string
          layer?: string | null
          linked_entry_id?: string | null
          parent_id?: string | null
          sort_value?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          world_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_sort_value?: number | null
          event_date?: string
          event_type?: string
          icon?: string | null
          id?: string
          layer?: string | null
          linked_entry_id?: string | null
          parent_id?: string | null
          sort_value?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chronicle_events_linked_entry_id_fkey"
            columns: ["linked_entry_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chronicle_events_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chronicle_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chronicle_events_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      entity_worksheets: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          is_primary: boolean | null
          worksheet_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          is_primary?: boolean | null
          worksheet_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          is_primary?: boolean | null
          worksheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_worksheets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_worksheets_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_connections: {
        Row: {
          access_token: string
          bot_id: string
          created_at: string | null
          duplicated_template_id: string | null
          id: string
          updated_at: string | null
          user_id: string
          workspace_icon: string | null
          workspace_id: string
          workspace_name: string | null
        }
        Insert: {
          access_token: string
          bot_id: string
          created_at?: string | null
          duplicated_template_id?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          workspace_icon?: string | null
          workspace_id: string
          workspace_name?: string | null
        }
        Update: {
          access_token?: string
          bot_id?: string
          created_at?: string | null
          duplicated_template_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          workspace_icon?: string | null
          workspace_id?: string
          workspace_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      simulation_saves: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          name: string
          narrative_notes: Json | null
          simulator_type: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
          world_id: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          name?: string
          narrative_notes?: Json | null
          simulator_type: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          world_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          name?: string
          narrative_notes?: Json | null
          simulator_type?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_saves_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          price_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      // Remaining tables omitted for brevity - see generated types
      worksheets: {
        Row: {
          archived_at: string | null
          created_at: string
          data: Json
          id: string
          tags: string[] | null
          title: string | null
          tool_type: string
          updated_at: string
          user_id: string
          world_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          data?: Json
          id?: string
          tags?: string[] | null
          title?: string | null
          tool_type: string
          updated_at?: string
          user_id: string
          world_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          data?: Json
          id?: string
          tags?: string[] | null
          title?: string | null
          tool_type?: string
          updated_at?: string
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worksheets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worksheets_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_entry_entities: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          writing_entry_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          writing_entry_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          writing_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_entry_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_entry_entities_writing_entry_id_fkey"
            columns: ["writing_entry_id"]
            isOneToOne: false
            referencedRelation: "writing_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
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
