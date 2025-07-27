export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      marche_audio: {
        Row: {
          created_at: string
          description: string | null
          duree_secondes: number | null
          format_audio: string | null
          id: string
          marche_id: string
          metadata: Json | null
          nom_fichier: string
          ordre: number | null
          taille_octets: number | null
          titre: string | null
          url_originale: string | null
          url_supabase: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duree_secondes?: number | null
          format_audio?: string | null
          id?: string
          marche_id: string
          metadata?: Json | null
          nom_fichier: string
          ordre?: number | null
          taille_octets?: number | null
          titre?: string | null
          url_originale?: string | null
          url_supabase: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duree_secondes?: number | null
          format_audio?: string | null
          id?: string
          marche_id?: string
          metadata?: Json | null
          nom_fichier?: string
          ordre?: number | null
          taille_octets?: number | null
          titre?: string | null
          url_originale?: string | null
          url_supabase?: string
        }
        Relationships: [
          {
            foreignKeyName: "marche_audio_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_documents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          marche_id: string
          metadata: Json | null
          nom_fichier: string
          ordre: number | null
          taille_octets: number | null
          titre: string | null
          type_document: string | null
          url_originale: string | null
          url_supabase: string
          version: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          marche_id: string
          metadata?: Json | null
          nom_fichier: string
          ordre?: number | null
          taille_octets?: number | null
          titre?: string | null
          type_document?: string | null
          url_originale?: string | null
          url_supabase: string
          version?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          marche_id?: string
          metadata?: Json | null
          nom_fichier?: string
          ordre?: number | null
          taille_octets?: number | null
          titre?: string | null
          type_document?: string | null
          url_originale?: string | null
          url_supabase?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marche_documents_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_etudes: {
        Row: {
          chapitres: Json | null
          contenu: string
          created_at: string
          id: string
          marche_id: string
          ordre: number | null
          resume: string | null
          titre: string
          type_etude: Database["public"]["Enums"]["etude_type"] | null
          updated_at: string
        }
        Insert: {
          chapitres?: Json | null
          contenu: string
          created_at?: string
          id?: string
          marche_id: string
          ordre?: number | null
          resume?: string | null
          titre: string
          type_etude?: Database["public"]["Enums"]["etude_type"] | null
          updated_at?: string
        }
        Update: {
          chapitres?: Json | null
          contenu?: string
          created_at?: string
          id?: string
          marche_id?: string
          ordre?: number | null
          resume?: string | null
          titre?: string
          type_etude?: Database["public"]["Enums"]["etude_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marche_etudes_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          marche_id: string
          metadata: Json | null
          nom_fichier: string
          ordre: number | null
          titre: string | null
          url_originale: string | null
          url_supabase: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          marche_id: string
          metadata?: Json | null
          nom_fichier: string
          ordre?: number | null
          titre?: string | null
          url_originale?: string | null
          url_supabase: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          marche_id?: string
          metadata?: Json | null
          nom_fichier?: string
          ordre?: number | null
          titre?: string | null
          url_originale?: string | null
          url_supabase?: string
        }
        Relationships: [
          {
            foreignKeyName: "marche_photos_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_tags: {
        Row: {
          categorie: string | null
          created_at: string
          id: string
          marche_id: string
          tag: string
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          id?: string
          marche_id: string
          tag: string
        }
        Update: {
          categorie?: string | null
          created_at?: string
          id?: string
          marche_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "marche_tags_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_videos: {
        Row: {
          created_at: string
          description: string | null
          duree_secondes: number | null
          format_video: string | null
          id: string
          marche_id: string
          metadata: Json | null
          nom_fichier: string
          ordre: number | null
          resolution: string | null
          taille_octets: number | null
          thumbnail_url: string | null
          titre: string | null
          url_originale: string | null
          url_supabase: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duree_secondes?: number | null
          format_video?: string | null
          id?: string
          marche_id: string
          metadata?: Json | null
          nom_fichier: string
          ordre?: number | null
          resolution?: string | null
          taille_octets?: number | null
          thumbnail_url?: string | null
          titre?: string | null
          url_originale?: string | null
          url_supabase: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duree_secondes?: number | null
          format_video?: string | null
          id?: string
          marche_id?: string
          metadata?: Json | null
          nom_fichier?: string
          ordre?: number | null
          resolution?: string | null
          taille_octets?: number | null
          thumbnail_url?: string | null
          titre?: string | null
          url_originale?: string | null
          url_supabase?: string
        }
        Relationships: [
          {
            foreignKeyName: "marche_videos_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      marches: {
        Row: {
          adresse: string | null
          coordonnees: unknown | null
          created_at: string
          date: string | null
          departement: string | null
          descriptif_court: string | null
          descriptif_long: string | null
          id: string
          latitude: number | null
          lien_google_drive: string | null
          longitude: number | null
          nom_marche: string | null
          region: string | null
          sous_themes: string[] | null
          temperature: number | null
          theme_principal: string | null
          updated_at: string
          ville: string
        }
        Insert: {
          adresse?: string | null
          coordonnees?: unknown | null
          created_at?: string
          date?: string | null
          departement?: string | null
          descriptif_court?: string | null
          descriptif_long?: string | null
          id?: string
          latitude?: number | null
          lien_google_drive?: string | null
          longitude?: number | null
          nom_marche?: string | null
          region?: string | null
          sous_themes?: string[] | null
          temperature?: number | null
          theme_principal?: string | null
          updated_at?: string
          ville: string
        }
        Update: {
          adresse?: string | null
          coordonnees?: unknown | null
          created_at?: string
          date?: string | null
          departement?: string | null
          descriptif_court?: string | null
          descriptif_long?: string | null
          id?: string
          latitude?: number | null
          lien_google_drive?: string | null
          longitude?: number | null
          nom_marche?: string | null
          region?: string | null
          sous_themes?: string[] | null
          temperature?: number | null
          theme_principal?: string | null
          updated_at?: string
          ville?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      etude_type: "principale" | "complementaire" | "annexe"
      media_type: "photo" | "audio" | "video" | "document"
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
      etude_type: ["principale", "complementaire", "annexe"],
      media_type: ["photo", "audio", "video", "document"],
    },
  },
} as const
