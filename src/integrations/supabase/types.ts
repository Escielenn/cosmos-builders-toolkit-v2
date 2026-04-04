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
      entities: {
        Row: {
          cascade_stage: string
          color: string | null
          created_at: string | null
          custom_type_label: string | null
          description: string | null
          entity_type: string
          graph_x: number | null
          graph_y: number | null
          icon: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          notes: string | null
          parent_entity_id: string | null
          pinned: boolean | null
          sort_order: number | null
          summary: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          world_id: string
        }
        Insert: {
          cascade_stage?: string
          color?: string | null
          created_at?: string | null
          custom_type_label?: string | null
          description?: string | null
          entity_type: string
          graph_x?: number | null
          graph_y?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          parent_entity_id?: string | null
          pinned?: boolean | null
          sort_order?: number | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          world_id: string
        }
        Update: {
          cascade_stage?: string
          color?: string | null
          created_at?: string | null
          custom_type_label?: string | null
          description?: string | null
          entity_type?: string
          graph_x?: number | null
          graph_y?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          parent_entity_id?: string | null
          pinned?: boolean | null
          sort_order?: number | null
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_connections: {
        Row: {
          bidirectional: boolean | null
          cascade_stage: string
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          relationship_label: string | null
          relationship_type: string
          sort_order: number | null
          source_entity_id: string
          status: string | null
          strength: number | null
          target_entity_id: string
          time_end: string | null
          time_start: string | null
          updated_at: string | null
          user_id: string
          world_id: string
        }
        Insert: {
          bidirectional?: boolean | null
          cascade_stage: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          relationship_label?: string | null
          relationship_type: string
          sort_order?: number | null
          source_entity_id: string
          status?: string | null
          strength?: number | null
          target_entity_id: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
          user_id: string
          world_id: string
        }
        Update: {
          bidirectional?: boolean | null
          cascade_stage?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          relationship_label?: string | null
          relationship_type?: string
          sort_order?: number | null
          source_entity_id?: string
          status?: string | null
          strength?: number | null
          target_entity_id?: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_connections_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_connections_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_connections_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
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
      roadmap_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          priority_order: number
          released_at: string | null
          status: string
          target_quarter: string | null
          title: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          priority_order?: number
          released_at?: string | null
          status?: string
          target_quarter?: string | null
          title: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          priority_order?: number
          released_at?: string | null
          status?: string
          target_quarter?: string | null
          title?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: []
      }
      roadmap_votes: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          roadmap_item_id: string
          updated_at: string
          user_id: string
          vote_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          roadmap_item_id: string
          updated_at?: string
          user_id: string
          vote_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          roadmap_item_id?: string
          updated_at?: string
          user_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_audio_tracks: {
        Row: {
          artist: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number
          filename: string
          id: string
          mime_type: string
          storage_path: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes: number
          filename: string
          id?: string
          mime_type: string
          storage_path: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number
          filename?: string
          id?: string
          mime_type?: string
          storage_path?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_playlists: {
        Row: {
          created_at: string
          id: string
          name: string
          tracks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          tracks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tracks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worksheet_link_shares: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          owner_id: string
          share_token: string
          updated_at: string
          view_count: number
          worksheet_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          owner_id: string
          share_token?: string
          updated_at?: string
          view_count?: number
          worksheet_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          owner_id?: string
          share_token?: string
          updated_at?: string
          view_count?: number
          worksheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worksheet_link_shares_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worksheet_link_shares_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: true
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
        ]
      }
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
      world_collaborators: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          role: string
          updated_at: string
          user_id: string
          world_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          role?: string
          updated_at?: string
          user_id: string
          world_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          role?: string
          updated_at?: string
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "world_collaborators_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_connections: {
        Row: {
          connection_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          source_entry_id: string | null
          source_worksheet_id: string | null
          target_entry_id: string | null
          target_worksheet_id: string | null
          updated_at: string
          world_id: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          source_entry_id?: string | null
          source_worksheet_id?: string | null
          target_entry_id?: string | null
          target_worksheet_id?: string | null
          updated_at?: string
          world_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          source_entry_id?: string | null
          source_worksheet_id?: string | null
          target_entry_id?: string | null
          target_worksheet_id?: string | null
          updated_at?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_connections_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
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
            foreignKeyName: "world_connections_target_entry_id_fkey"
            columns: ["target_entry_id"]
            isOneToOne: false
            referencedRelation: "world_entries"
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
            foreignKeyName: "world_connections_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_entries: {
        Row: {
          color: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          entry_type: string
          icon: string | null
          id: string
          layer: string | null
          metadata: Json | null
          parent_id: string | null
          sort_order: number
          tags: string[] | null
          title: string
          tool_data_id: string | null
          tool_source: string | null
          updated_at: string
          world_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          entry_type: string
          icon?: string | null
          id?: string
          layer?: string | null
          metadata?: Json | null
          parent_id?: string | null
          sort_order?: number
          tags?: string[] | null
          title: string
          tool_data_id?: string | null
          tool_source?: string | null
          updated_at?: string
          world_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          entry_type?: string
          icon?: string | null
          id?: string
          layer?: string | null
          metadata?: Json | null
          parent_id?: string | null
          sort_order?: number
          tags?: string[] | null
          title?: string
          tool_data_id?: string | null
          tool_source?: string | null
          updated_at?: string
          world_id?: string
        }
        Relationships: [
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
          },
          {
            foreignKeyName: "world_entries_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          invited_email: string
          role: string
          status: string
          updated_at: string
          world_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by: string
          invited_email: string
          role?: string
          status?: string
          updated_at?: string
          world_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          invited_email?: string
          role?: string
          status?: string
          updated_at?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_invites_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_link_shares: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          owner_id: string
          share_token: string
          updated_at: string
          view_count: number
          world_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          owner_id: string
          share_token?: string
          updated_at?: string
          view_count?: number
          world_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          owner_id?: string
          share_token?: string
          updated_at?: string
          view_count?: number
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_link_shares_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_link_shares_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: true
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          world_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
          world_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_notes_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      world_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          label: string | null
          snapshot_data: Json
          version_number: number
          world_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          label?: string | null
          snapshot_data: Json
          version_number: number
          world_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          label?: string | null
          snapshot_data?: Json
          version_number?: number
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_versions_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      worlds: {
        Row: {
          archived_at: string | null
          calendar_config: Json | null
          created_at: string
          description: string | null
          header_image_focus_y: number
          header_image_url: string | null
          icon: string | null
          id: string
          name: string
          snapshot_at: string | null
          tags: string[] | null
          theme: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          calendar_config?: Json | null
          created_at?: string
          description?: string | null
          header_image_focus_y?: number
          header_image_url?: string | null
          icon?: string | null
          id?: string
          name: string
          snapshot_at?: string | null
          tags?: string[] | null
          theme?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          calendar_config?: Json | null
          created_at?: string
          description?: string | null
          header_image_focus_y?: number
          header_image_url?: string | null
          icon?: string | null
          id?: string
          name?: string
          snapshot_at?: string | null
          tags?: string[] | null
          theme?: Json | null
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
      writing_entries: {
        Row: {
          archived_at: string | null
          content: string | null
          created_at: string
          id: string
          prompt_id: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          word_count: number | null
          world_id: string | null
        }
        Insert: {
          archived_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          prompt_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          word_count?: number | null
          world_id?: string | null
        }
        Update: {
          archived_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          prompt_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writing_entries_world_id_fkey"
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
      entity_connections_bidirectional: {
        Row: {
          bidirectional: boolean | null
          cascade_stage: string | null
          id: string | null
          metadata: Json | null
          notes: string | null
          relationship_label: string | null
          relationship_type: string | null
          source_cascade: string | null
          source_color: string | null
          source_entity_id: string | null
          source_name: string | null
          source_type: string | null
          status: string | null
          strength: number | null
          target_cascade: string | null
          target_color: string | null
          target_entity_id: string | null
          target_name: string | null
          target_type: string | null
          time_end: string | null
          time_start: string | null
          world_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_connections_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_connections_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_connections_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_world_invite: { Args: { p_token: string }; Returns: Json }
      admin_clear_done_todos: { Args: never; Returns: undefined }
      admin_create_roadmap_item: {
        Args: {
          p_category?: string
          p_description?: string
          p_target_quarter?: string
          p_title: string
        }
        Returns: Json
      }
      admin_create_todo: {
        Args: {
          p_description?: string
          p_linked_contact_id?: string
          p_linked_ticket_id?: string
          p_priority?: string
          p_title: string
        }
        Returns: Json
      }
      admin_delete_roadmap_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      admin_delete_todo: { Args: { p_todo_id: string }; Returns: undefined }
      admin_get_recent_activity: { Args: { p_limit?: number }; Returns: Json }
      admin_get_stats: { Args: never; Returns: Json }
      admin_get_subscription_stats: { Args: never; Returns: Json }
      admin_get_user_detail: { Args: { p_user_id: string }; Returns: Json }
      admin_list_contacts: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: Json
      }
      admin_list_roadmap_items: {
        Args: { p_limit?: number; p_status?: string }
        Returns: Json
      }
      admin_list_subscriptions: {
        Args: { p_limit?: number; p_status?: string }
        Returns: Json
      }
      admin_list_tickets:
        | {
            Args: {
              p_category?: string
              p_limit?: number
              p_offset?: number
              p_status?: string
            }
            Returns: Json
          }
        | {
            Args: { p_limit?: number; p_offset?: number; p_status?: string }
            Returns: Json
          }
      admin_list_todos: {
        Args: { p_limit?: number; p_status?: string }
        Returns: Json
      }
      admin_list_users: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      admin_search_users: {
        Args: { p_limit?: number; p_query: string }
        Returns: Json
      }
      admin_update_contact: {
        Args: {
          p_admin_notes?: string
          p_contact_id: string
          p_status?: string
        }
        Returns: undefined
      }
      admin_update_roadmap_item: {
        Args: {
          p_category?: string
          p_description?: string
          p_item_id: string
          p_priority_order?: number
          p_status?: string
          p_target_quarter?: string
          p_title?: string
        }
        Returns: undefined
      }
      admin_update_ticket: {
        Args: {
          p_admin_notes?: string
          p_priority?: string
          p_status?: string
          p_ticket_id: string
        }
        Returns: undefined
      }
      admin_update_todo: {
        Args: {
          p_priority?: string
          p_status?: string
          p_title?: string
          p_todo_id: string
        }
        Returns: undefined
      }
      cast_roadmap_vote: {
        Args: { p_roadmap_item_id: string; p_vote_count?: number }
        Returns: Json
      }
      cleanup_world_versions: { Args: never; Returns: number }
      compile_world_snapshot: { Args: { p_world_id: string }; Returns: Json }
      get_collaborators_for_world: {
        Args: { p_world_id: string }
        Returns: Json
      }
      get_shared_worksheet: { Args: { p_token: string }; Returns: Json }
      get_shared_world: { Args: { p_token: string }; Returns: Json }
      get_subscription_tier: {
        Args: { check_user_id: string }
        Returns: string
      }
      lookup_user_by_email: { Args: { p_email: string }; Returns: Json }
      maybe_snapshot_world: { Args: { p_world_id: string }; Returns: boolean }
      remove_roadmap_vote: {
        Args: { p_roadmap_item_id: string; p_vote_count?: number }
        Returns: Json
      }
      save_world_snapshot: {
        Args: { p_label?: string; p_world_id: string }
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
