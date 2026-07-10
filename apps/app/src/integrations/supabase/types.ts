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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      circle_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          circle_id: string
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          circle_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          circle_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_messages_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          joined_at: string
          role: Database["public"]["Enums"]["circle_role"]
          user_id: string
        }
        Insert: {
          circle_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["circle_role"]
          user_id: string
        }
        Update: {
          circle_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["circle_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          public_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          public_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          public_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      completions: {
        Row: {
          completed_at: string | null
          created_at: string
          data: Json
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["completion_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["completion_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["completion_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "completions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          created_from_plan_id: string | null
          id: string
          requested_by: string
          responded_at: string | null
          status: Database["public"]["Enums"]["friendship_status"]
          user_1_id: string
          user_2_id: string
        }
        Insert: {
          created_at?: string
          created_from_plan_id?: string | null
          id?: string
          requested_by: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friendship_status"]
          user_1_id: string
          user_2_id: string
        }
        Update: {
          created_at?: string
          created_from_plan_id?: string | null
          id?: string
          requested_by?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["friendship_status"]
          user_1_id?: string
          user_2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_created_from_plan_id_fkey"
            columns: ["created_from_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_1_id_fkey"
            columns: ["user_1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_2_id_fkey"
            columns: ["user_2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          completion_id: string
          created_at: string
          id: string
          plan_id: string
        }
        Insert: {
          completion_id: string
          created_at?: string
          id?: string
          plan_id: string
        }
        Update: {
          completion_id?: string
          created_at?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_completion_id_fkey"
            columns: ["completion_id"]
            isOneToOne: true
            referencedRelation: "completions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          related_plan_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          related_plan_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          related_plan_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_plan_id_fkey"
            columns: ["related_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_invites: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_token: string
          is_active: boolean
          plan_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_token: string
          is_active?: boolean
          plan_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_token?: string
          is_active?: boolean
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_invites_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_participants: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          responded_at: string | null
          role: Database["public"]["Enums"]["participant_role"]
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          delivery_status: "DELIVERED"
          updated_at: string
          user_id: string
          circle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          responded_at?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          delivery_status?: "DELIVERED"
          updated_at?: string
          user_id: string
          circle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          responded_at?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          delivery_status?: "DELIVERED"
          updated_at?: string
          user_id?: string
          circle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_participants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_teams: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_id: string
          team: Database["public"]["Enums"]["team_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_id: string
          team: Database["public"]["Enums"]["team_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_id?: string
          team?: Database["public"]["Enums"]["team_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_teams_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          category: Database["public"]["Enums"]["activity_category"]
          created_at: string
          description: string
          total_cost: number
          host_id: string
          id: string
          max_participants: number | null
          place_address: string
          place_id: string
          place_name: string
          public_id: string
          rsvp_deadline: string
          scheduled_at: string
          status: Database["public"]["Enums"]["plan_status"]
          subcategory: Database["public"]["Enums"]["activity_subcategory"]
          title: string
          updated_at: string
          circle_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["activity_category"]
          created_at?: string
          description?: string
          total_cost?: number
          host_id: string
          id?: string
          max_participants?: number | null
          place_address: string
          place_id: string
          place_name: string
          public_id: string
          rsvp_deadline: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["plan_status"]
          subcategory: Database["public"]["Enums"]["activity_subcategory"]
          title: string
          updated_at?: string
          circle_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["activity_category"]
          created_at?: string
          description?: string
          total_cost?: number
          host_id?: string
          id?: string
          max_participants?: number | null
          place_address?: string
          place_id?: string
          place_name?: string
          public_id?: string
          rsvp_deadline?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["plan_status"]
          subcategory?: Database["public"]["Enums"]["activity_subcategory"]
          title?: string
          updated_at?: string
          circle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "plan_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "plan_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string
          created_at: string
          full_name: string
          id: string
          profile_completed: boolean
          profile_url: string | null
          public_id: string
          updated_at: string
        }
        Insert: {
          bio?: string
          created_at?: string
          full_name?: string
          id: string
          profile_completed?: boolean
          profile_url?: string | null
          public_id: string
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          full_name?: string
          id?: string
          profile_completed?: boolean
          profile_url?: string | null
          public_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          creditor_id: string
          debtor_id: string
          id: string
          paid_at: string | null
          plan_id: string
          status: Database["public"]["Enums"]["wallet_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          creditor_id: string
          debtor_id: string
          id?: string
          paid_at?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["wallet_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          creditor_id?: string
          debtor_id?: string
          id?: string
          paid_at?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["wallet_status"]
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_creditor_id_fkey"
            columns: ["creditor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_user_public_id: { Args: never; Returns: string }
    }
    Enums: {
      activity_category:
        | "SPORTS"
        | "MOVIES"
        | "DINING"
        | "ENTERTAINMENT"
        | "TRAVEL"
        | "FITNESS"
        | "STUDY"
        | "OTHER"
      activity_subcategory:
        | "FOOTBALL"
        | "BADMINTON"
        | "CRICKET"
        | "BASKETBALL"
        | "VOLLEYBALL"
        | "TENNIS"
        | "PICKLEBALL"
        | "BOWLING"
        | "GO_KARTING"
        | "MOVIE"
        | "RESTAURANT"
        | "CAFE"
        | "ROAD_TRIP"
        | "GYM"
        | "STUDY_SESSION"
        | "OTHER"
      circle_role: "creator_admin" | "admin" | "member"
      completion_status: "PENDING" | "SUBMITTED" | "VERIFIED"
      friendship_status: "PENDING" | "ACCEPTED" | "REJECTED"
      message_status: "SENT" | "DELIVERED"
      notification_type:
        | "PLAN_INVITATION"
        | "PARTICIPANT_JOINED"
        | "PARTICIPANT_SKIPPED"
        | "PLAN_CANCELLED"
        | "PLAN_REMINDER"
        | "FRIEND_REQUEST"
        | "FRIEND_REQUEST_ACCEPTED"
        | "PAYMENT_RECEIVED"
        | "PAYMENT_REMINDER"
        | "MEMORY_GENERATED"
      participant_role: "HOST" | "CO_HOST" | "PARTICIPANT"
      plan_status: "LIVE" | "COMPLETED" | "CANCELLED"
      rsvp_status: "INVITED" | "JOINED" | "SKIPPED" | "WAITLISTED"
      team_type: "TEAM_1" | "TEAM_2"
      wallet_status: "PENDING" | "PAID"
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
      activity_category: [
        "SPORTS",
        "MOVIES",
        "DINING",
        "ENTERTAINMENT",
        "TRAVEL",
        "FITNESS",
        "STUDY",
        "OTHER",
      ],
      activity_subcategory: [
        "FOOTBALL",
        "BADMINTON",
        "CRICKET",
        "BASKETBALL",
        "VOLLEYBALL",
        "TENNIS",
        "PICKLEBALL",
        "BOWLING",
        "GO_KARTING",
        "MOVIE",
        "RESTAURANT",
        "CAFE",
        "ROAD_TRIP",
        "GYM",
        "STUDY_SESSION",
        "OTHER",
      ],
      circle_role: ["creator_admin", "admin", "member"],
      completion_status: ["PENDING", "SUBMITTED", "VERIFIED"],
      friendship_status: ["PENDING", "ACCEPTED", "REJECTED"],
      message_status: ["SENT", "DELIVERED"],
      notification_type: [
        "PLAN_INVITATION",
        "PARTICIPANT_JOINED",
        "PARTICIPANT_SKIPPED",
        "PLAN_CANCELLED",
        "PLAN_REMINDER",
        "FRIEND_REQUEST",
        "FRIEND_REQUEST_ACCEPTED",
        "PAYMENT_RECEIVED",
        "PAYMENT_REMINDER",
        "MEMORY_GENERATED",
      ],
      participant_role: ["HOST", "CO_HOST", "PARTICIPANT"],
      plan_status: ["LIVE", "COMPLETED", "CANCELLED"],
      rsvp_status: ["INVITED", "JOINED", "SKIPPED", "WAITLISTED"],
      team_type: ["TEAM_1", "TEAM_2"],
      wallet_status: ["PENDING", "PAID"],
    },
  },
} as const
