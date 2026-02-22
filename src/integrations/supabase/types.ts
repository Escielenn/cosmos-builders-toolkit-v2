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
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          message: string
          user_id: string | null
          status: "new" | "read" | "responded" | "archived"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          message: string
          user_id?: string | null
          status?: "new" | "read" | "responded" | "archived"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          message?: string
          user_id?: string | null
          status?: "new" | "read" | "responded" | "archived"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chronicle_events: {
        Row: {
          id: string
          world_id: string
          title: string
          description: string | null
          event_date: string
          sort_value: number
          end_date: string | null
          end_sort_value: number | null
          event_type: string
          layer: string | null
          parent_id: string | null
          linked_entry_id: string | null
          icon: string | null
          color: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          title: string
          description?: string | null
          event_date: string
          sort_value: number
          end_date?: string | null
          end_sort_value?: number | null
          event_type?: string
          layer?: string | null
          parent_id?: string | null
          linked_entry_id?: string | null
          icon?: string | null
          color?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          title?: string
          description?: string | null
          event_date?: string
          sort_value?: number
          end_date?: string | null
          end_sort_value?: number | null
          event_type?: string
          layer?: string | null
          parent_id?: string | null
          linked_entry_id?: string | null
          icon?: string | null
          color?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chronicle_events_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
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
            foreignKeyName: "chronicle_events_linked_entry_id_fkey"
            columns: ["linked_entry_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          }
        ]
      }
      support_tickets: {
        Row: {
          id: string
          ticket_number: string
          name: string
          email: string
          category: "bug" | "feature" | "billing" | "account" | "other"
          priority: "low" | "normal" | "high" | "urgent"
          subject: string
          message: string
          user_id: string | null
          status: "open" | "in_progress" | "waiting" | "resolved" | "closed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number?: string
          name: string
          email: string
          category: "bug" | "feature" | "billing" | "account" | "other"
          priority?: "low" | "normal" | "high" | "urgent"
          subject: string
          message: string
          user_id?: string | null
          status?: "open" | "in_progress" | "waiting" | "resolved" | "closed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          name?: string
          email?: string
          category?: "bug" | "feature" | "billing" | "account" | "other"
          priority?: "low" | "normal" | "high" | "urgent"
          subject?: string
          message?: string
          user_id?: string | null
          status?: "open" | "in_progress" | "waiting" | "resolved" | "closed"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notion_connections: {
        Row: {
          id: string
          user_id: string
          access_token: string
          workspace_id: string
          workspace_name: string | null
          workspace_icon: string | null
          bot_id: string
          duplicated_template_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          workspace_id: string
          workspace_name?: string | null
          workspace_icon?: string | null
          bot_id: string
          duplicated_template_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          workspace_id?: string
          workspace_name?: string | null
          workspace_icon?: string | null
          bot_id?: string
          duplicated_template_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notion_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          price_id: string
          plan_type: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status?: string
          price_id: string
          plan_type: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          status?: string
          price_id?: string
          plan_type?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      worksheets: {
        Row: {
          archived_at: string | null
          created_at: string
          data: Json
          id: string
          tags: string[]
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
          tags?: string[]
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
          tags?: string[]
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
      worksheet_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      world_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      world_notes: {
        Row: {
          id: string
          world_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_notes_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worksheet_link_shares: {
        Row: {
          id: string
          worksheet_id: string
          owner_id: string
          share_token: string
          enabled: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          worksheet_id: string
          owner_id: string
          share_token?: string
          enabled?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          worksheet_id?: string
          owner_id?: string
          share_token?: string
          enabled?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worksheet_link_shares_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: true
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worksheet_link_shares_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      world_collaborators: {
        Row: {
          id: string
          world_id: string
          user_id: string
          role: "viewer" | "editor"
          invited_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          user_id: string
          role?: "viewer" | "editor"
          invited_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          user_id?: string
          role?: "viewer" | "editor"
          invited_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_collaborators_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      world_invites: {
        Row: {
          id: string
          world_id: string
          invited_email: string
          role: "viewer" | "editor"
          invited_by: string
          invite_token: string
          status: "pending" | "accepted" | "declined" | "expired"
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          world_id: string
          invited_email: string
          role?: "viewer" | "editor"
          invited_by: string
          invite_token?: string
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          invited_email?: string
          role?: "viewer" | "editor"
          invited_by?: string
          invite_token?: string
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_invites_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      world_link_shares: {
        Row: {
          id: string
          world_id: string
          owner_id: string
          share_token: string
          enabled: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          owner_id: string
          share_token?: string
          enabled?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          owner_id?: string
          share_token?: string
          enabled?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_link_shares_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: true
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_link_shares_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      world_versions: {
        Row: {
          id: string
          world_id: string
          version_number: number
          label: string | null
          snapshot_data: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          world_id: string
          version_number: number
          label?: string | null
          snapshot_data: Json
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          version_number?: number
          label?: string | null
          snapshot_data?: Json
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_versions_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          }
        ]
      }
      world_connections: {
        Row: {
          id: string
          world_id: string
          source_worksheet_id: string | null
          target_worksheet_id: string | null
          source_entry_id: string | null
          target_entry_id: string | null
          connection_type: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          source_worksheet_id?: string | null
          target_worksheet_id?: string | null
          source_entry_id?: string | null
          target_entry_id?: string | null
          connection_type?: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          source_worksheet_id?: string | null
          target_worksheet_id?: string | null
          source_entry_id?: string | null
          target_entry_id?: string | null
          connection_type?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_connections_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_connections_source_worksheet_id_fkey"
            columns: ["source_worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_connections_target_worksheet_id_fkey"
            columns: ["target_worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_connections_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_connections_target_entry_id_fkey"
            columns: ["target_entry_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          }
        ]
      }
      world_entries: {
        Row: {
          id: string
          world_id: string
          entry_type: "note" | "milestone" | "decision" | "reference" | "lore"
          title: string
          content: string | null
          metadata: Json
          sort_order: number
          parent_id: string | null
          icon: string | null
          color: string | null
          tool_source: string | null
          tool_data_id: string | null
          layer: string | null
          cover_image_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          world_id: string
          entry_type: "note" | "milestone" | "decision" | "reference" | "lore"
          title: string
          content?: string | null
          metadata?: Json
          sort_order?: number
          parent_id?: string | null
          icon?: string | null
          color?: string | null
          tool_source?: string | null
          tool_data_id?: string | null
          layer?: string | null
          cover_image_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          world_id?: string
          entry_type?: "note" | "milestone" | "decision" | "reference" | "lore"
          title?: string
          content?: string | null
          metadata?: Json
          sort_order?: number
          parent_id?: string | null
          icon?: string | null
          color?: string | null
          tool_source?: string | null
          tool_data_id?: string | null
          layer?: string | null
          cover_image_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_entries_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_entries_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_entries_tool_data_id_fkey"
            columns: ["tool_data_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          }
        ]
      }
      worlds: {
        Row: {
          archived_at: string | null
          calendar_config: Json
          created_at: string
          description: string | null
          header_image_focus_y: number
          header_image_url: string | null
          icon: string
          id: string
          name: string
          snapshot_at: string | null
          tags: string[]
          theme: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          calendar_config?: Json
          created_at?: string
          description?: string | null
          header_image_focus_y?: number
          header_image_url?: string | null
          icon?: string
          id?: string
          name: string
          snapshot_at?: string | null
          tags?: string[]
          theme?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          calendar_config?: Json
          created_at?: string
          description?: string | null
          header_image_focus_y?: number
          header_image_url?: string | null
          icon?: string
          id?: string
          name?: string
          snapshot_at?: string | null
          tags?: string[]
          theme?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worlds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shared_worksheet: {
        Args: { p_token: string }
        Returns: Json
      }
      get_shared_world: {
        Args: { p_token: string }
        Returns: Json
      }
      lookup_user_by_email: {
        Args: { p_email: string }
        Returns: Json
      }
      accept_world_invite: {
        Args: { p_token: string }
        Returns: Json
      }
      get_collaborators_for_world: {
        Args: { p_world_id: string }
        Returns: Json
      }
      compile_world_snapshot: {
        Args: { p_world_id: string }
        Returns: Json
      }
      maybe_snapshot_world: {
        Args: { p_world_id: string }
        Returns: boolean
      }
      save_world_snapshot: {
        Args: { p_world_id: string; p_label?: string }
        Returns: Json
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
