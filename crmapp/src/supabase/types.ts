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
      admins: {
        Row: {
          id: string
          name: string | null
          username: string
        }
        Insert: {
          id: string
          name?: string | null
          username?: string
        }
        Update: {
          id?: string
          name?: string | null
          username?: string
        }
        Relationships: []
      }
      client_package_history: {
        Row: {
          client_id: number
          created_at: string | null
          created_by_uuid: string | null
          end_date: string | null
          id: number
          package_id: number | null
          start_date: string
        }
        Insert: {
          client_id: number
          created_at?: string | null
          created_by_uuid?: string | null
          end_date?: string | null
          id?: number
          package_id?: number | null
          start_date?: string
        }
        Update: {
          client_id?: number
          created_at?: string | null
          created_by_uuid?: string | null
          end_date?: string | null
          id?: number
          package_id?: number | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_package_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_package_history_created_by_uuid_fkey"
            columns: ["created_by_uuid"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_package_history_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_shares: {
        Row: {
          client_id: number
          primary_admin_id: string | null
          shared_with_admin_id: string
        }
        Insert: {
          client_id: number
          primary_admin_id?: string | null
          shared_with_admin_id: string
        }
        Update: {
          client_id?: number
          primary_admin_id?: string | null
          shared_with_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_shares_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_shares_primary_admin_id_fkey"
            columns: ["primary_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_shares_shared_with_admin_id_fkey"
            columns: ["shared_with_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          admin_id: string | null
          created_at: string
          dob: string | null
          email: string | null
          id: number
          is_active: boolean
          issue: string | null
          lifewave_id: number | null
          name: string
          notes: string | null
          package_id: number | null
          phone: string | null
          sponsor: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          issue?: string | null
          lifewave_id?: number | null
          name: string
          notes?: string | null
          package_id?: number | null
          phone?: string | null
          sponsor?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          dob?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          issue?: string | null
          lifewave_id?: number | null
          name?: string
          notes?: string | null
          package_id?: number | null
          phone?: string | null
          sponsor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          quantity_collected: number
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          quantity_collected?: number
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          quantity_collected?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: number
          collection_date: string | null
          collection_status: string
          enroller_id: number | null
          enroller_name: string | null
          enrollment_date: string
          expiry_date: string
          id: number
          is_maintenance: boolean
          is_partially_collected: boolean
          notes: string | null
          order_items: string | null
          order_number: string | null
          payment_date: string | null
          payment_mode: string | null
          shipping_location: string | null
        }
        Insert: {
          client_id: number
          collection_date?: string | null
          collection_status?: string
          enroller_id?: number | null
          enroller_name?: string | null
          enrollment_date?: string
          expiry_date: string
          id?: number
          is_maintenance?: boolean
          is_partially_collected?: boolean
          notes?: string | null
          order_items?: string | null
          order_number?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          shipping_location?: string | null
        }
        Update: {
          client_id?: number
          collection_date?: string | null
          collection_status?: string
          enroller_id?: number | null
          enroller_name?: string | null
          enrollment_date?: string
          expiry_date?: string
          id?: number
          is_maintenance?: boolean
          is_partially_collected?: boolean
          notes?: string | null
          order_items?: string | null
          order_number?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          shipping_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          id: number
          name: string
          points: number | null
          price: number
        }
        Insert: {
          id?: number
          name: string
          points?: number | null
          price: number
        }
        Update: {
          id?: number
          name?: string
          points?: number | null
          price?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          duration: string | null
          id: number
          name: string
          point_cost: number
        }
        Insert: {
          duration?: string | null
          id?: number
          name: string
          point_cost: number
        }
        Update: {
          duration?: string | null
          id?: number
          name?: string
          point_cost?: number
        }
        Relationships: []
      }
      reminders: {
        Row: {
          client_id: number
          id: number
          message: string
          order_id: number | null
          reminder_type: string
          status: string
          trigger_date: string
        }
        Insert: {
          client_id: number
          id?: number
          message: string
          order_id?: number | null
          reminder_type: string
          status?: string
          trigger_date: string
        }
        Update: {
          client_id?: number
          id?: number
          message?: string
          order_id?: number | null
          reminder_type?: string
          status?: string
          trigger_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      create_admin_with_username: {
        Args: { admin_id: string; admin_name: string; admin_username: string }
        Returns: boolean
      }
      create_client: {
        Args: {
          admin_uuid: string
          client_dob?: string
          client_email?: string
          client_issue?: string
          client_lifewave_id?: number
          client_name: string
          client_notes?: string
          client_package_id?: number
          client_phone?: string
          client_sponsor?: string
        }
        Returns: Json
      }
      create_expiry_reminder: {
        Args: {
          admin_uuid_param: string
          client_id_param: number
          expiry_date_param: string
          order_id_param: number
        }
        Returns: Json
      }
      create_order: {
        Args: {
          admin_uuid: string
          client_id_param: number
          collection_date_param?: string
          enroller_id_param?: number
          enroller_name_param?: string
          enrollment_date_param: string
          expiry_date_param: string
          is_maintenance_param?: boolean
          notes_param?: string
          order_items_param?: Json
          order_items_text_param?: string
          order_number_param: string
          payment_date_param?: string
          payment_mode_param?: string
          shipping_location_param?: string
        }
        Returns: number
      }
      create_reminder: {
        Args: {
          admin_uuid: string
          p_client_id: number
          p_message: string
          p_order_id?: number
          p_reminder_type: string
          p_trigger_date: string
        }
        Returns: Json
      }
      delete_client: {
        Args: { admin_uuid: string; client_id_param: number }
        Returns: Json
      }
      delete_order: {
        Args: { admin_uuid: string; order_id_param: number }
        Returns: boolean
      }
      delete_reminder: {
        Args: { admin_uuid: string; p_reminder_id: number }
        Returns: Json
      }
      get_client_details: {
        Args: { admin_uuid: string; client_id: number }
        Returns: Json
      }
      get_client_orders: {
        Args: { admin_uuid: string; client_id_param: number }
        Returns: {
          collection_date: string
          collection_status: string
          enroller_id: number | null
          enroller_name: string | null
          enrollment_date: string
          expiry_date: string
          is_maintenance: boolean
          is_partially_collected: boolean
          notes: string
          order_id: number
          order_items: string
          order_number: string
          payment_date: string
          payment_mode: string
          shipping_location: string
          total_collected: number
          total_items: number
        }[]
      }
      get_client_package_history: {
        Args: { admin_uuid: string; p_client_id: number }
        Returns: Json
      }
      get_client_with_package_details: {
        Args: { admin_uuid_param: string; client_id_param: number }
        Returns: {
          client_email: string
          client_id: number
          client_name: string
          client_phone: string
          package_id: number
          package_name: string
          package_points: number
        }[]
      }
      get_clients_data: {
        Args: { admin_uuid: string }
        Returns: Json
      }
      get_clients_with_packages_for_admin: {
        Args: { admin_uuid_param: string }
        Returns: {
          client_email: string
          client_id: number
          client_name: string
          client_phone: string
          has_existing_order: boolean
          package_id: number
          package_name: string
          package_points: number
        }[]
      }
      get_dashboard_data: {
        Args: { admin_uuid: string; end_date?: string; start_date?: string }
        Returns: Json
      }
      get_order_details: {
        Args: { admin_uuid: string; order_id_param: number }
        Returns: {
          client_id: number
          client_name: string
          collection_date: string
          collection_status: string
          enroller_id: number | null
          enroller_name: string | null
          enrollment_date: string
          expiry_date: string
          is_maintenance: boolean
          is_partially_collected: boolean
          is_shared: boolean
          item_id: number
          order_id: number
          order_items: string
          order_notes: string
          order_number: string
          payment_date: string
          payment_mode: string
          point_cost: number
          product_id: number
          product_name: string
          quantity: number
          quantity_collected: number
          shipping_location: string
        }[]
      }
      get_orders: {
        Args: {
          admin_uuid: string
          end_date?: string
          limit_count?: number
          offset_count?: number
          search_term?: string
          start_date?: string
        }
        Returns: {
          client_id: number
          client_name: string
          collection_date: string
          collection_status: string
          enroller_id: number | null
          enroller_name: string | null
          enrollment_date: string
          expiry_date: string
          is_maintenance: boolean
          is_partially_collected: boolean
          is_shared: boolean
          notes: string
          order_id: number
          order_items: string
          order_number: string
          payment_date: string
          payment_mode: string
          shipping_location: string
          total_count: number
        }[]
      }
      get_orders_for_admin: {
        Args: {
          admin_uuid: string
          search_term?: string
          sort_by?: string
          sort_order?: string
        }
        Returns: Json
      }
      get_packages: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pending_reminder_count: {
        Args: { admin_uuid: string }
        Returns: number
      }
      get_products: {
        Args: Record<PropertyKey, never>
        Returns: {
          duration: string
          id: number
          name: string
          point_cost: number
        }[]
      }
      get_products_for_admin: {
        Args: { admin_uuid: string }
        Returns: {
          duration: string
          id: number
          name: string
          point_cost: number
        }[]
      }
      get_reminder_details: {
        Args: { admin_uuid: string; p_reminder_id: number }
        Returns: Json
      }
      get_reminder_stats: {
        Args: { admin_uuid: string }
        Returns: Json
      }
      get_reminders_for_admin: {
        Args: {
          admin_uuid: string
          end_date?: string
          limit_count?: number
          offset_count?: number
          reminder_type_filter?: string
          search_term?: string
          sort_by?: string
          sort_order?: string
          start_date?: string
        }
        Returns: {
          client_id: number
          client_name: string
          client_phone: string
          id: number
          message: string
          order_id: number
          reminder_type: string
          status: string
          total_count: number
          trigger_date: string
        }[]
      }
      get_user_by_username: {
        Args: { username_input: string }
        Returns: {
          user_exists: boolean
          user_id: string
          username: string
        }[]
      }
      mark_reminder_completed: {
        Args: { admin_uuid: string; p_reminder_id: number }
        Returns: Json
      }
      update_client: {
        Args: {
          admin_uuid: string
          client_dob?: string
          client_email?: string
          client_id: number
          client_issue?: string
          client_lifewave_id?: number
          client_name?: string
          client_notes?: string
          client_package_id?: number
          client_phone?: string
          client_sponsor?: string
        }
        Returns: Json
      }
      update_order: {
        Args: {
          admin_uuid: string
          collection_date_param?: string
          enroller_id_param?: number
          enroller_name_param?: string
          enrollment_date_param: string
          expiry_date_param: string
          is_maintenance_param?: boolean
          is_partially_collected_param?: boolean
          item_collections_param?: Json
          notes_param?: string
          order_id_param: number
          order_items_param?: Json
          order_items_text_param?: string
          order_number_param?: string
          payment_date_param?: string
          payment_mode_param?: string
          shipping_location_param?: string
        }
        Returns: boolean
      }
      update_reminder: {
        Args: {
          admin_uuid: string
          p_message?: string
          p_reminder_id: number
          p_status?: string
          p_trigger_date?: string
        }
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
