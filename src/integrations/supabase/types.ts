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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_initialization: {
        Row: {
          created_at: string
          id: string
          is_initialized: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_initialized?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_initialized?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      fables_narratives: {
        Row: {
          contenu_principal: string
          created_at: string
          dimensions_associees: string[] | null
          id: string
          inspiration_sources: Json | null
          marche_id: string
          notes_creative: Json | null
          opus_id: string | null
          ordre: number | null
          resume: string | null
          statut: string
          tags: Json | null
          titre: string
          updated_at: string
          variations: Json
          version: string
        }
        Insert: {
          contenu_principal: string
          created_at?: string
          dimensions_associees?: string[] | null
          id?: string
          inspiration_sources?: Json | null
          marche_id: string
          notes_creative?: Json | null
          opus_id?: string | null
          ordre?: number | null
          resume?: string | null
          statut?: string
          tags?: Json | null
          titre: string
          updated_at?: string
          variations?: Json
          version?: string
        }
        Update: {
          contenu_principal?: string
          created_at?: string
          dimensions_associees?: string[] | null
          id?: string
          inspiration_sources?: Json | null
          marche_id?: string
          notes_creative?: Json | null
          opus_id?: string | null
          ordre?: number | null
          resume?: string | null
          statut?: string
          tags?: Json | null
          titre?: string
          updated_at?: string
          variations?: Json
          version?: string
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
      marche_contextes_hybrids: {
        Row: {
          completude_score: number | null
          contexte_hydrologique: Json | null
          created_at: string
          empreintes_humaines: Json | null
          especes_caracteristiques: Json | null
          ia_fonctionnalites: Json | null
          id: string
          last_validation: string | null
          leviers_agroecologiques: Json | null
          marche_id: string
          nouvelles_activites: Json | null
          opus_id: string | null
          projection_2035_2045: Json | null
          sources: Json | null
          technodiversite: Json | null
          updated_at: string
          vocabulaire_local: Json | null
        }
        Insert: {
          completude_score?: number | null
          contexte_hydrologique?: Json | null
          created_at?: string
          empreintes_humaines?: Json | null
          especes_caracteristiques?: Json | null
          ia_fonctionnalites?: Json | null
          id?: string
          last_validation?: string | null
          leviers_agroecologiques?: Json | null
          marche_id: string
          nouvelles_activites?: Json | null
          opus_id?: string | null
          projection_2035_2045?: Json | null
          sources?: Json | null
          technodiversite?: Json | null
          updated_at?: string
          vocabulaire_local?: Json | null
        }
        Update: {
          completude_score?: number | null
          contexte_hydrologique?: Json | null
          created_at?: string
          empreintes_humaines?: Json | null
          especes_caracteristiques?: Json | null
          ia_fonctionnalites?: Json | null
          id?: string
          last_validation?: string | null
          leviers_agroecologiques?: Json | null
          marche_id?: string
          nouvelles_activites?: Json | null
          opus_id?: string | null
          projection_2035_2045?: Json | null
          sources?: Json | null
          technodiversite?: Json | null
          updated_at?: string
          vocabulaire_local?: Json | null
        }
        Relationships: []
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
      marche_photo_tags: {
        Row: {
          categorie: string | null
          created_at: string
          id: string
          photo_id: string
          tag: string
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          id?: string
          photo_id: string
          tag: string
        }
        Update: {
          categorie?: string | null
          created_at?: string
          id?: string
          photo_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "marche_photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "marche_photos"
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
      marche_textes: {
        Row: {
          contenu: string
          created_at: string
          id: string
          marche_id: string
          metadata: Json | null
          ordre: number | null
          titre: string
          type_texte: string
          updated_at: string
        }
        Insert: {
          contenu: string
          created_at?: string
          id?: string
          marche_id: string
          metadata?: Json | null
          ordre?: number | null
          titre: string
          type_texte: string
          updated_at?: string
        }
        Update: {
          contenu?: string
          created_at?: string
          id?: string
          marche_id?: string
          metadata?: Json | null
          ordre?: number | null
          titre?: string
          type_texte?: string
          updated_at?: string
        }
        Relationships: []
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
      opus_explorations: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          language: string
          meta_description: string | null
          meta_keywords: string[]
          meta_title: string | null
          nom: string
          ordre: number | null
          published: boolean
          slug: string
          theme_principal: string
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
          nom: string
          ordre?: number | null
          published?: boolean
          slug: string
          theme_principal: string
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
          nom?: string
          ordre?: number | null
          published?: boolean
          slug?: string
          theme_principal?: string
          updated_at?: string
        }
        Relationships: []
      }
      opus_import_runs: {
        Row: {
          completude_score: number | null
          created_at: string
          error_message: string | null
          id: string
          marche_id: string
          mode: string
          opus_id: string
          request_payload: Json | null
          source: string | null
          status: string
          validation: Json | null
        }
        Insert: {
          completude_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          marche_id: string
          mode: string
          opus_id: string
          request_payload?: Json | null
          source?: string | null
          status: string
          validation?: Json | null
        }
        Update: {
          completude_score?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          marche_id?: string
          mode?: string
          opus_id?: string
          request_payload?: Json | null
          source?: string | null
          status?: string
          validation?: Json | null
        }
        Relationships: []
      }
      préfigurations_interactives: {
        Row: {
          config_interaction: Json | null
          config_navigation: Json
          config_sonore: Json | null
          config_visuelle: Json
          created_at: string
          fleuve_metadata: Json | null
          id: string
          nom_prefiguration: string
          opus_id: string
          ordre: number | null
          published: boolean
          temporal_layers: Json | null
          type_experience: string
          updated_at: string
        }
        Insert: {
          config_interaction?: Json | null
          config_navigation?: Json
          config_sonore?: Json | null
          config_visuelle?: Json
          created_at?: string
          fleuve_metadata?: Json | null
          id?: string
          nom_prefiguration: string
          opus_id: string
          ordre?: number | null
          published?: boolean
          temporal_layers?: Json | null
          type_experience: string
          updated_at?: string
        }
        Update: {
          config_interaction?: Json | null
          config_navigation?: Json
          config_sonore?: Json | null
          config_visuelle?: Json
          created_at?: string
          fleuve_metadata?: Json | null
          id?: string
          nom_prefiguration?: string
          opus_id?: string
          ordre?: number | null
          published?: boolean
          temporal_layers?: Json | null
          type_experience?: string
          updated_at?: string
        }
        Relationships: []
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
      species_translations: {
        Row: {
          alternative_names_fr: string[] | null
          common_name_en: string | null
          common_name_fr: string | null
          confidence_level: string
          created_at: string
          id: string
          scientific_name: string
          source: string
          updated_at: string
        }
        Insert: {
          alternative_names_fr?: string[] | null
          common_name_en?: string | null
          common_name_fr?: string | null
          confidence_level?: string
          created_at?: string
          id?: string
          scientific_name: string
          source?: string
          updated_at?: string
        }
        Update: {
          alternative_names_fr?: string[] | null
          common_name_en?: string | null
          common_name_fr?: string | null
          confidence_level?: string
          created_at?: string
          id?: string
          scientific_name?: string
          source?: string
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
      can_initialize_admin_system: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_is_admin_user: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_system_initialization_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      confirm_admin_email: {
        Args: { target_email: string }
        Returns: boolean
      }
      create_admin_user: {
        Args: { new_email: string; new_user_id: string }
        Returns: boolean
      }
      delete_exploration_page: {
        Args: { page_id: string }
        Returns: undefined
      }
      get_admin_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_admin_list_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          role: string
          user_id: string
        }[]
      }
      get_admin_users_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      get_current_admin_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_admin_email_secure: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_admin_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      get_current_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          role: string
        }[]
      }
      get_exploration_pages: {
        Args: { exploration_id_param: string }
        Returns: {
          config: Json
          created_at: string
          description: string
          exploration_id: string
          id: string
          nom: string
          ordre: number
          type: string
          updated_at: string
        }[]
      }
      get_structured_vocabulary_data: {
        Args: { marche_id_param: string }
        Returns: {
          phenomenes: Json
          pratiques: Json
          sources: Json
          termes_locaux: Json
        }[]
      }
      get_top_species_optimized: {
        Args: { limit_count?: number }
        Returns: {
          count: number
          name: string
        }[]
      }
      initialize_first_admin: {
        Args: { new_email: string; new_user_id: string }
        Returns: boolean
      }
      initialize_first_admin_by_email: {
        Args: { target_email: string }
        Returns: Json
      }
      initialize_first_admin_direct: {
        Args: { new_email: string; new_password: string }
        Returns: Json
      }
      insert_exploration_page: {
        Args:
          | {
              exploration_id_param: string
              page_config?: Json
              page_description?: string
              page_nom: string
              page_ordre: number
              page_type: string
            }
          | {
              exploration_id_param: string
              page_description?: string
              page_nom: string
              page_ordre: number
              page_type: string
            }
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_system_initialized: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      migrate_vocabulary_categorization: {
        Args: Record<PropertyKey, never>
        Returns: {
          changes_count: number
          migration_log: string
          rec_opus_id: string
        }[]
      }
      remove_admin_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      update_exploration_page: {
        Args:
          | {
              page_config?: Json
              page_description?: string
              page_id: string
              page_nom: string
              page_type: string
            }
          | {
              page_description?: string
              page_id: string
              page_nom: string
              page_type: string
            }
        Returns: undefined
      }
      update_pages_order: {
        Args: { new_orders: number[]; page_ids: string[] }
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
