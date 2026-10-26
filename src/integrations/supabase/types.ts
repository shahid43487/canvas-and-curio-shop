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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_secret: boolean
          rarity: string
          requirement_type: string
          requirement_value: number
          reward_discount_type: string
          reward_discount_value: number
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id: string
          is_active?: boolean
          is_secret?: boolean
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          reward_discount_type?: string
          reward_discount_value?: number
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_secret?: boolean
          rarity?: string
          requirement_type?: string
          requirement_value?: number
          reward_discount_type?: string
          reward_discount_value?: number
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_achievements: {
        Row: {
          achievement_id: string
          claimed_at: string | null
          completed_at: string | null
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          claimed_at?: string | null
          completed_at?: string | null
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          claimed_at?: string | null
          completed_at?: string | null
          progress?: number
          user_id?: string
        }
        Relationships: []
      }
      customer_cards: {
        Row: {
          acquired_at: string
          card_type: string
          id: string
          metadata: Json
          rarity: string
          serial_number: string
          source_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          card_type: string
          id?: string
          metadata?: Json
          rarity?: string
          serial_number?: string
          source_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          card_type?: string
          id?: string
          metadata?: Json
          rarity?: string
          serial_number?: string
          source_id?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_coupons: {
        Row: {
          code: string
          description: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          description?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          description?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: number
          quantity: number
          unit_price: number
          variation_id: string | null
          variation_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: number
          quantity?: number
          unit_price?: number
          variation_id?: string | null
          variation_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: number
          quantity?: number
          unit_price?: number
          variation_id?: string | null
          variation_name?: string | null
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
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          bkash_transaction_id: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number
          id: string
          order_source: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string
          shipping_address: string
          shipping_city: string
          shipping_email: string | null
          shipping_name: string
          shipping_notes: string | null
          shipping_phone: string
          status: string
          total_amount: number
          user_id: string | null
        }
        Insert: {
          bkash_transaction_id?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          order_source?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string
          shipping_address: string
          shipping_city: string
          shipping_email?: string | null
          shipping_name: string
          shipping_notes?: string | null
          shipping_phone: string
          status?: string
          total_amount?: number
          user_id?: string | null
        }
        Update: {
          bkash_transaction_id?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          order_source?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string
          shipping_address?: string
          shipping_city?: string
          shipping_email?: string | null
          shipping_name?: string
          shipping_notes?: string | null
          shipping_phone?: string
          status?: string
          total_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      product_variations: {
        Row: {
          bundle_quantity: number
          button_config: Json
          compare_at_price: number | null
          created_at: string
          display_order: number
          id: string
          image_key: string | null
          is_active: boolean
          name: string
          price: number
          product_id: number
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          bundle_quantity?: number
          button_config?: Json
          compare_at_price?: number | null
          created_at?: string
          display_order?: number
          id?: string
          image_key?: string | null
          is_active?: boolean
          name: string
          price: number
          product_id: number
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          bundle_quantity?: number
          button_config?: Json
          compare_at_price?: number | null
          created_at?: string
          display_order?: number
          id?: string
          image_key?: string | null
          is_active?: boolean
          name?: string
          price?: number
          product_id?: number
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          batch: string
          color: string
          colors: string[]
          created_at: string
          description: string
          dims: string
          id: number
          image_key: string
          is_hidden: boolean
          material: string
          name: string
          num: string
          price: number
          requires_advance_payment: boolean
          selector_mode: string
          stock: number
          tag: string
          updated_at: string
        }
        Insert: {
          batch?: string
          color?: string
          colors?: string[]
          created_at?: string
          description?: string
          dims?: string
          id: number
          image_key?: string
          is_hidden?: boolean
          material?: string
          name: string
          num?: string
          price?: number
          requires_advance_payment?: boolean
          selector_mode?: string
          stock?: number
          tag?: string
          updated_at?: string
        }
        Update: {
          batch?: string
          color?: string
          colors?: string[]
          created_at?: string
          description?: string
          dims?: string
          id?: number
          image_key?: string
          is_hidden?: boolean
          material?: string
          name?: string
          num?: string
          price?: number
          requires_advance_payment?: boolean
          selector_mode?: string
          stock?: number
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_find_user_by_email: { Args: { lookup: string }; Returns: string }
      cancel_customer_order: { Args: { order_id: string }; Returns: undefined }
      create_order_with_items: {
        Args: { items: Json; order_data: Json }
        Returns: string
      }
      create_owned_order: {
        Args: {
          coupon_code?: string
          items: Json
          order_data: Json
          owner_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      payment_method: "cod" | "bkash"
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
    Enums: {
      payment_method: ["cod", "bkash"],
    },
  },
} as const
