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
      biodiversity_snapshots: {
        Row: {
          biodiversity_index: number | null
          birds_count: number
          created_at: string
          fungi_count: number
          id: string
          latitude: number
          longitude: number
          marche_id: string
          methodology: Json | null
          others_count: number
          plants_count: number
          radius_meters: number
          recent_observations: number
          snapshot_date: string
          sources_data: Json | null
          species_data: Json | null
          species_richness: number | null
          total_species: number
          updated_at: string
        }
        Insert: {
          biodiversity_index?: number | null
          birds_count?: number
          created_at?: string
          fungi_count?: number
          id?: string
          latitude: number
          longitude: number
          marche_id: string
          methodology?: Json | null
          others_count?: number
          plants_count?: number
          radius_meters?: number
          recent_observations?: number
          snapshot_date?: string
          sources_data?: Json | null
          species_data?: Json | null
          species_richness?: number | null
          total_species?: number
          updated_at?: string
        }
        Update: {
          biodiversity_index?: number | null
          birds_count?: number
          created_at?: string
          fungi_count?: number
          id?: string
          latitude?: number
          longitude?: number
          marche_id?: string
          methodology?: Json | null
          others_count?: number
          plants_count?: number
          radius_meters?: number
          recent_observations?: number
          snapshot_date?: string
          sources_data?: Json | null
          species_data?: Json | null
          species_richness?: number | null
          total_species?: number
          updated_at?: string
        }
        Relationships: []
      }
      data_collection_logs: {
        Row: {
          collection_mode: string
          collection_type: string
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error_details: Json | null
          errors_count: number | null
          id: string
          last_ping: string | null
          marches_processed: number | null
          marches_total: number | null
          started_at: string
          status: string
          summary_stats: Json | null
        }
        Insert: {
          collection_mode: string
          collection_type: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          last_ping?: string | null
          marches_processed?: number | null
          marches_total?: number | null
          started_at?: string
          status?: string
          summary_stats?: Json | null
        }
        Update: {
          collection_mode?: string
          collection_type?: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          last_ping?: string | null
          marches_processed?: number | null
          marches_total?: number | null
          started_at?: string
          status?: string
          summary_stats?: Json | null
        }
        Relationships: []
      }
      exploration_clicks: {
        Row: {
          action: string
          created_at: string
          exploration_id: string | null
          geo_lat: number | null
          geo_lng: number | null
          id: string
          marche_id: string | null
          narrative_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          exploration_id?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          marche_id?: string | null
          narrative_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          exploration_id?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          marche_id?: string | null
          narrative_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exploration_clicks_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exploration_clicks_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exploration_clicks_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narrative_landscapes"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration_feedbacks: {
        Row: {
          comment: string
          created_at: string
          exploration_id: string | null
          id: string
          language: string
          marche_id: string | null
          narrative_id: string | null
          rating: number | null
        }
        Insert: {
          comment: string
          created_at?: string
          exploration_id?: string | null
          id?: string
          language?: string
          marche_id?: string | null
          narrative_id?: string | null
          rating?: number | null
        }
        Update: {
          comment?: string
          created_at?: string
          exploration_id?: string | null
          id?: string
          language?: string
          marche_id?: string | null
          narrative_id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exploration_feedbacks_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exploration_feedbacks_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exploration_feedbacks_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narrative_landscapes"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration_marches: {
        Row: {
          created_at: string
          exploration_id: string
          id: string
          marche_id: string
          ordre: number | null
        }
        Insert: {
          created_at?: string
          exploration_id: string
          id?: string
          marche_id: string
          ordre?: number | null
        }
        Update: {
          created_at?: string
          exploration_id?: string
          id?: string
          marche_id?: string
          ordre?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exploration_marches_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exploration_marches_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration_narrative_settings: {
        Row: {
          created_at: string
          exploration_id: string
          id: string
          marche_view_config: Json | null
          marche_view_model: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exploration_id: string
          id?: string
          marche_view_config?: Json | null
          marche_view_model?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exploration_id?: string
          id?: string
          marche_view_config?: Json | null
          marche_view_model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_settings_exploration"
            columns: ["exploration_id"]
            isOneToOne: true
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration_pages: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          exploration_id: string
          id: string
          nom: string
          ordre: number
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          exploration_id: string
          id?: string
          nom: string
          ordre: number
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          exploration_id?: string
          id?: string
          nom?: string
          ordre?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      explorations: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          language: string
          meta_description: string | null
          meta_keywords: string[]
          meta_title: string | null
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          meta_description?: string | null
          meta_keywords?: string[]
          meta_title?: string | null
          name: string
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          meta_description?: string | null
          meta_keywords?: string[]
          meta_title?: string | null
          name?: string
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      narrative_fragments: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          exploration_id: string
          id: string
          kind: string
          marche_id: string | null
          ordre: number | null
          session_id: string
          tts_voice: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          exploration_id: string
          id?: string
          kind: string
          marche_id?: string | null
          ordre?: number | null
          session_id: string
          tts_voice?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          exploration_id?: string
          id?: string
          kind?: string
          marche_id?: string | null
          ordre?: number | null
          session_id?: string
          tts_voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_fragments_exploration"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fragments_marche"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fragments_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "narrative_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_interactions: {
        Row: {
          created_at: string
          exploration_id: string
          id: string
          marche_id: string | null
          payload: Json | null
          session_id: string
          type: string
        }
        Insert: {
          created_at?: string
          exploration_id: string
          id?: string
          marche_id?: string | null
          payload?: Json | null
          session_id: string
          type: string
        }
        Update: {
          created_at?: string
          exploration_id?: string
          id?: string
          marche_id?: string | null
          payload?: Json | null
          session_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_interactions_exploration"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_marche"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interactions_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "narrative_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_landscapes: {
        Row: {
          ai_prompt: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          exploration_id: string
          id: string
          language: string
          meta_description: string | null
          meta_keywords: string[]
          meta_title: string | null
          name: string
          ordre: number
          slug: string
          updated_at: string
        }
        Insert: {
          ai_prompt?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          exploration_id: string
          id?: string
          language?: string
          meta_description?: string | null
          meta_keywords?: string[]
          meta_title?: string | null
          name: string
          ordre?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ai_prompt?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          exploration_id?: string
          id?: string
          language?: string
          meta_description?: string | null
          meta_keywords?: string[]
          meta_title?: string | null
          name?: string
          ordre?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_landscapes_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_sessions: {
        Row: {
          context: Json | null
          created_at: string
          exploration_id: string
          id: string
          language: string
          referrer: string | null
          session_key: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          exploration_id: string
          id?: string
          language?: string
          referrer?: string | null
          session_key?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          exploration_id?: string
          id?: string
          language?: string
          referrer?: string | null
          session_key?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sessions_exploration"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_snapshots: {
        Row: {
          avg_price_m2: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          marche_id: string
          median_price_m2: number | null
          radius_meters: number
          raw_data: Json | null
          snapshot_date: string
          source: string
          total_volume: number | null
          transactions_count: number
          transactions_data: Json | null
          updated_at: string
        }
        Insert: {
          avg_price_m2?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          marche_id: string
          median_price_m2?: number | null
          radius_meters?: number
          raw_data?: Json | null
          snapshot_date?: string
          source?: string
          total_volume?: number | null
          transactions_count?: number
          transactions_data?: Json | null
          updated_at?: string
        }
        Update: {
          avg_price_m2?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          marche_id?: string
          median_price_m2?: number | null
          radius_meters?: number
          raw_data?: Json | null
          snapshot_date?: string
          source?: string
          total_volume?: number | null
          transactions_count?: number
          transactions_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      weather_snapshots: {
        Row: {
          created_at: string
          humidity_avg: number | null
          humidity_max: number | null
          humidity_min: number | null
          id: string
          latitude: number
          longitude: number
          marche_id: string
          precipitation_days: number | null
          precipitation_total: number | null
          raw_data: Json | null
          snapshot_date: string
          source: string
          sunshine_hours: number | null
          temperature_avg: number | null
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string
          wind_speed_avg: number | null
        }
        Insert: {
          created_at?: string
          humidity_avg?: number | null
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          latitude: number
          longitude: number
          marche_id: string
          precipitation_days?: number | null
          precipitation_total?: number | null
          raw_data?: Json | null
          snapshot_date?: string
          source?: string
          sunshine_hours?: number | null
          temperature_avg?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
          wind_speed_avg?: number | null
        }
        Update: {
          created_at?: string
          humidity_avg?: number | null
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          latitude?: number
          longitude?: number
          marche_id?: string
          precipitation_days?: number | null
          precipitation_total?: number | null
          raw_data?: Json | null
          snapshot_date?: string
          source?: string
          sunshine_hours?: number | null
          temperature_avg?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
          wind_speed_avg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_exploration_page: {
        Args: { page_id: string }
        Returns: undefined
      }
      get_exploration_pages: {
        Args: { exploration_id_param: string }
        Returns: {
          id: string
          exploration_id: string
          type: string
          ordre: number
          nom: string
          description: string
          config: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_top_species_optimized: {
        Args: { limit_count?: number }
        Returns: {
          name: string
          count: number
        }[]
      }
      insert_exploration_page: {
        Args: {
          exploration_id_param: string
          page_type: string
          page_ordre: number
          page_nom: string
          page_description?: string
        }
        Returns: string
      }
      update_exploration_page: {
        Args: {
          page_id: string
          page_type: string
          page_nom: string
          page_description?: string
        }
        Returns: undefined
      }
      update_pages_order: {
        Args: { page_ids: string[]; new_orders: number[] }
        Returns: undefined
      }
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
