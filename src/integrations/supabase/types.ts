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
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      dordonia_atlas: {
        Row: {
          contenu: string | null
          created_at: string
          exploration_id: string | null
          grid_cell: string
          id: string
          is_silent_zone: boolean | null
          session_id: string
          type_entree: string
        }
        Insert: {
          contenu?: string | null
          created_at?: string
          exploration_id?: string | null
          grid_cell: string
          id?: string
          is_silent_zone?: boolean | null
          session_id: string
          type_entree: string
        }
        Update: {
          contenu?: string | null
          created_at?: string
          exploration_id?: string | null
          grid_cell?: string
          id?: string
          is_silent_zone?: boolean | null
          session_id?: string
          type_entree?: string
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_atlas_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      dordonia_care_registry: {
        Row: {
          accomplished_at: string | null
          acte_soin: string
          created_at: string
          id: string
          revers_id: string
          statut: string
          temoignage: string | null
        }
        Insert: {
          accomplished_at?: string | null
          acte_soin: string
          created_at?: string
          id?: string
          revers_id: string
          statut?: string
          temoignage?: string | null
        }
        Update: {
          accomplished_at?: string | null
          acte_soin?: string
          created_at?: string
          id?: string
          revers_id?: string
          statut?: string
          temoignage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_care_registry_revers_id_fkey"
            columns: ["revers_id"]
            isOneToOne: false
            referencedRelation: "dordonia_revers"
            referencedColumns: ["id"]
          },
        ]
      }
      dordonia_choeur: {
        Row: {
          apparition: string
          created_at: string
          expires_at: string | null
          exploration_id: string | null
          id: string
          is_ephemeral: boolean | null
          session_id: string
        }
        Insert: {
          apparition: string
          created_at?: string
          expires_at?: string | null
          exploration_id?: string | null
          id?: string
          is_ephemeral?: boolean | null
          session_id: string
        }
        Update: {
          apparition?: string
          created_at?: string
          expires_at?: string | null
          exploration_id?: string | null
          id?: string
          is_ephemeral?: boolean | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_choeur_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      dordonia_fragments: {
        Row: {
          contenu: string | null
          created_at: string
          id: string
          is_silence: boolean | null
          metadata: Json | null
          scenario: string
          session_id: string | null
        }
        Insert: {
          contenu?: string | null
          created_at?: string
          id?: string
          is_silence?: boolean | null
          metadata?: Json | null
          scenario: string
          session_id?: string | null
        }
        Update: {
          contenu?: string | null
          created_at?: string
          id?: string
          is_silence?: boolean | null
          metadata?: Json | null
          scenario?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_fragments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dordonia_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dordonia_parlement: {
        Row: {
          cas_deliberation: string
          created_at: string
          decision: string | null
          deliberation: string | null
          donnees_sobres: Json | null
          id: string
          incertitude_affichee: string | null
          pv_genere: string | null
          revers_id: string | null
          session_id: string | null
          veto_riviere: boolean | null
        }
        Insert: {
          cas_deliberation: string
          created_at?: string
          decision?: string | null
          deliberation?: string | null
          donnees_sobres?: Json | null
          id?: string
          incertitude_affichee?: string | null
          pv_genere?: string | null
          revers_id?: string | null
          session_id?: string | null
          veto_riviere?: boolean | null
        }
        Update: {
          cas_deliberation?: string
          created_at?: string
          decision?: string | null
          deliberation?: string | null
          donnees_sobres?: Json | null
          id?: string
          incertitude_affichee?: string | null
          pv_genere?: string | null
          revers_id?: string | null
          session_id?: string | null
          veto_riviere?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_parlement_revers_id_fkey"
            columns: ["revers_id"]
            isOneToOne: false
            referencedRelation: "dordonia_revers"
            referencedColumns: ["id"]
          },
        ]
      }
      dordonia_revers: {
        Row: {
          created_at: string
          decision: string
          dette_reparation: string | null
          exploration_id: string | null
          id: string
          is_sealed: boolean | null
          pertes_humain_differe: Json | null
          pertes_humain_immediat: Json | null
          pertes_machine: Json | null
          pertes_riviere: Json | null
          sealed_at: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          dette_reparation?: string | null
          exploration_id?: string | null
          id?: string
          is_sealed?: boolean | null
          pertes_humain_differe?: Json | null
          pertes_humain_immediat?: Json | null
          pertes_machine?: Json | null
          pertes_riviere?: Json | null
          sealed_at?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          dette_reparation?: string | null
          exploration_id?: string | null
          id?: string
          is_sealed?: boolean | null
          pertes_humain_differe?: Json | null
          pertes_humain_immediat?: Json | null
          pertes_machine?: Json | null
          pertes_riviere?: Json | null
          sealed_at?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_revers_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      dordonia_sessions: {
        Row: {
          context: Json | null
          created_at: string
          exploration_id: string | null
          id: string
          scenario_actif: string | null
          session_key: string
          seuil_ou_es_tu: string | null
          seuil_que_cherches_tu: string | null
          seuil_quel_risque: string | null
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          exploration_id?: string | null
          id?: string
          scenario_actif?: string | null
          session_key: string
          seuil_ou_es_tu?: string | null
          seuil_que_cherches_tu?: string | null
          seuil_quel_risque?: string | null
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          exploration_id?: string | null
          id?: string
          scenario_actif?: string | null
          session_key?: string
          seuil_ou_es_tu?: string | null
          seuil_que_cherches_tu?: string | null
          seuil_quel_risque?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dordonia_sessions_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_analytics: {
        Row: {
          created_at: string
          exploration_id: string
          id: string
          last_message_content: string | null
          last_reservation_location: string | null
          nb_messages_sent: number
          nb_popup_planning_shown: number
          nb_popup_video_shown: number
          nb_reservations: number
          session_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exploration_id: string
          id?: string
          last_message_content?: string | null
          last_reservation_location?: string | null
          nb_messages_sent?: number
          nb_popup_planning_shown?: number
          nb_popup_video_shown?: number
          nb_reservations?: number
          session_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exploration_id?: string
          id?: string
          last_message_content?: string | null
          last_reservation_location?: string | null
          nb_messages_sent?: number
          nb_popup_planning_shown?: number
          nb_popup_video_shown?: number
          nb_reservations?: number
          session_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_analytics_exploration"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
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
      exploration_engagement_settings: {
        Row: {
          created_at: string
          exploration_id: string
          id: string
          popup_planning_enabled: boolean
          popup_video_enabled: boolean
          temps_parametrable_seconds: number
          updated_at: string
          video_youtube_url: string | null
        }
        Insert: {
          created_at?: string
          exploration_id: string
          id?: string
          popup_planning_enabled?: boolean
          popup_video_enabled?: boolean
          temps_parametrable_seconds?: number
          updated_at?: string
          video_youtube_url?: string | null
        }
        Update: {
          created_at?: string
          exploration_id?: string
          id?: string
          popup_planning_enabled?: boolean
          popup_video_enabled?: boolean
          temps_parametrable_seconds?: number
          updated_at?: string
          video_youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_engagement_exploration"
            columns: ["exploration_id"]
            isOneToOne: true
            referencedRelation: "explorations"
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
          partie_id: string | null
          publication_status: string
        }
        Insert: {
          created_at?: string
          exploration_id: string
          id?: string
          marche_id: string
          ordre?: number | null
          partie_id?: string | null
          publication_status?: string
        }
        Update: {
          created_at?: string
          exploration_id?: string
          id?: string
          marche_id?: string
          ordre?: number | null
          partie_id?: string | null
          publication_status?: string
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
          {
            foreignKeyName: "exploration_marches_partie_id_fkey"
            columns: ["partie_id"]
            isOneToOne: false
            referencedRelation: "exploration_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration_marcheurs: {
        Row: {
          avatar_url: string | null
          bio_courte: string | null
          couleur: string | null
          created_at: string | null
          exploration_id: string
          id: string
          is_principal: boolean | null
          nom: string
          ordre: number | null
          prenom: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio_courte?: string | null
          couleur?: string | null
          created_at?: string | null
          exploration_id: string
          id?: string
          is_principal?: boolean | null
          nom: string
          ordre?: number | null
          prenom: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio_courte?: string | null
          couleur?: string | null
          created_at?: string | null
          exploration_id?: string
          id?: string
          is_principal?: boolean | null
          nom?: string
          ordre?: number | null
          prenom?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exploration_marcheurs_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
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
      exploration_parties: {
        Row: {
          couleur: string | null
          created_at: string
          description: string | null
          exploration_id: string
          id: string
          numero_romain: string
          ordre: number
          sous_titre: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          description?: string | null
          exploration_id: string
          id?: string
          numero_romain?: string
          ordre?: number
          sous_titre?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          couleur?: string | null
          created_at?: string
          description?: string | null
          exploration_id?: string
          id?: string
          numero_romain?: string
          ordre?: number
          sous_titre?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exploration_parties_exploration_id_fkey"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
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
      export_keywords: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          keyword: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          keyword: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          keyword?: string
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
      gaspard_events: {
        Row: {
          created_at: string
          current_attendees: number
          description: string | null
          end_date: string
          google_event_id: string | null
          id: string
          is_bookable: boolean
          location: string | null
          max_attendees: number | null
          start_date: string
          synced_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_attendees?: number
          description?: string | null
          end_date: string
          google_event_id?: string | null
          id?: string
          is_bookable?: boolean
          location?: string | null
          max_attendees?: number | null
          start_date: string
          synced_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_attendees?: number
          description?: string | null
          end_date?: string
          google_event_id?: string | null
          id?: string
          is_bookable?: boolean
          location?: string | null
          max_attendees?: number | null
          start_date?: string
          synced_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gaspard_messages: {
        Row: {
          created_at: string
          event_id: string | null
          exploration_id: string | null
          id: string
          message: string
          relance_j48_sent: boolean
          relance_j48_sent_at: string | null
          sender_email: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          exploration_id?: string | null
          id?: string
          message: string
          relance_j48_sent?: boolean
          relance_j48_sent_at?: string | null
          sender_email: string
          sender_name: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          exploration_id?: string | null
          id?: string
          message?: string
          relance_j48_sent?: boolean
          relance_j48_sent_at?: string | null
          sender_email?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_message_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gaspard_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_message_exploration"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      gaspard_reservations: {
        Row: {
          created_at: string
          email: string
          event_id: string
          exploration_id: string | null
          first_name: string
          id: string
          last_name: string
          message: string | null
          phone: string | null
          rappel_j48_sent: boolean
          rappel_j48_sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          exploration_id?: string | null
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          phone?: string | null
          rappel_j48_sent?: boolean
          rappel_j48_sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          exploration_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          phone?: string | null
          rappel_j48_sent?: boolean
          rappel_j48_sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reservation_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gaspard_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reservation_exploration"
            columns: ["exploration_id"]
            isOneToOne: false
            referencedRelation: "explorations"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_audio: {
        Row: {
          created_at: string
          description: string | null
          duree_secondes: number | null
          format_audio: string | null
          id: string
          literary_type: string | null
          marche_id: string
          metadata: Json | null
          nom_fichier: string
          ordre: number | null
          taille_octets: number | null
          titre: string | null
          transcription_confidence: number | null
          transcription_created_at: string | null
          transcription_model: string | null
          transcription_segments: Json | null
          transcription_status: string | null
          transcription_text: string | null
          type_audio: string | null
          url_originale: string | null
          url_supabase: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duree_secondes?: number | null
          format_audio?: string | null
          id?: string
          literary_type?: string | null
          marche_id: string
          metadata?: Json | null
          nom_fichier: string
          ordre?: number | null
          taille_octets?: number | null
          titre?: string | null
          transcription_confidence?: number | null
          transcription_created_at?: string | null
          transcription_model?: string | null
          transcription_segments?: Json | null
          transcription_status?: string | null
          transcription_text?: string | null
          type_audio?: string | null
          url_originale?: string | null
          url_supabase: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duree_secondes?: number | null
          format_audio?: string | null
          id?: string
          literary_type?: string | null
          marche_id?: string
          metadata?: Json | null
          nom_fichier?: string
          ordre?: number | null
          taille_octets?: number | null
          titre?: string | null
          transcription_confidence?: number | null
          transcription_created_at?: string | null
          transcription_model?: string | null
          transcription_segments?: Json | null
          transcription_status?: string | null
          transcription_text?: string | null
          type_audio?: string | null
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
          coordonnees: unknown
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
          coordonnees?: unknown
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
          coordonnees?: unknown
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
      marcheur_observations: {
        Row: {
          created_at: string | null
          id: string
          marche_id: string
          marcheur_id: string
          notes: string | null
          observation_date: string | null
          photo_url: string | null
          species_scientific_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          marche_id: string
          marcheur_id: string
          notes?: string | null
          observation_date?: string | null
          photo_url?: string | null
          species_scientific_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          marche_id?: string
          marcheur_id?: string
          notes?: string | null
          observation_date?: string | null
          photo_url?: string | null
          species_scientific_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "marcheur_observations_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marcheur_observations_marcheur_id_fkey"
            columns: ["marcheur_id"]
            isOneToOne: false
            referencedRelation: "exploration_marcheurs"
            referencedColumns: ["id"]
          },
        ]
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
      published_exports: {
        Row: {
          artistic_direction: string | null
          author: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          expires_at: string | null
          exploration_id: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          published_at: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artistic_direction?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          expires_at?: string | null
          exploration_id?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          published_at?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artistic_direction?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          expires_at?: string | null
          exploration_id?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          published_at?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "published_exports_exploration_id_fkey"
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
      transcription_models: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          languages: Json | null
          model_identifier: string
          name: string
          provider: string
          supports_realtime: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          languages?: Json | null
          model_identifier: string
          name: string
          provider: string
          supports_realtime?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          languages?: Json | null
          model_identifier?: string
          name?: string
          provider?: string
          supports_realtime?: boolean | null
          updated_at?: string | null
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
      admin_operation_wrapper: {
        Args: { operation_type: string }
        Returns: boolean
      }
      can_initialize_admin_system: { Args: never; Returns: boolean }
      check_is_admin_user: { Args: { check_user_id: string }; Returns: boolean }
      check_system_initialization_safe: { Args: never; Returns: boolean }
      confirm_admin_email: { Args: { target_email: string }; Returns: boolean }
      create_admin_user: {
        Args: { new_email: string; new_user_id: string }
        Returns: boolean
      }
      delete_exploration_page: { Args: { page_id: string }; Returns: undefined }
      get_admin_count: { Args: never; Returns: number }
      get_admin_count_secure: { Args: never; Returns: number }
      get_admin_list_safe: {
        Args: never
        Returns: {
          created_at: string
          id: string
          role: string
          user_id: string
        }[]
      }
      get_admin_list_secure_no_emails: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_current_user: boolean
          role: string
          user_id: string
        }[]
      }
      get_admin_users_list: {
        Args: never
        Returns: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      get_current_admin_email: { Args: never; Returns: string }
      get_current_admin_email_secure: { Args: never; Returns: string }
      get_current_admin_info: {
        Args: never
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
        Args: never
        Returns: {
          created_at: string
          id: string
          role: string
        }[]
      }
      get_exploration_marches_by_status: {
        Args: {
          exploration_id_param: string
          include_drafts?: boolean
          readers_mode?: boolean
        }
        Returns: {
          created_at: string
          exploration_id: string
          id: string
          marche_id: string
          ordre: number
          publication_status: string
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
      get_my_admin_email_only: { Args: never; Returns: string }
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
      increment_download_count: {
        Args: { export_slug: string }
        Returns: undefined
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
      insert_exploration_page:
        | {
            Args: {
              exploration_id_param: string
              page_description?: string
              page_nom: string
              page_ordre: number
              page_type: string
            }
            Returns: string
          }
        | {
            Args: {
              exploration_id_param: string
              page_config?: Json
              page_description?: string
              page_nom: string
              page_ordre: number
              page_type: string
            }
            Returns: string
          }
      is_admin_user: { Args: never; Returns: boolean }
      is_system_initialized: { Args: never; Returns: boolean }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      migrate_vocabulary_categorization: {
        Args: never
        Returns: {
          changes_count: number
          migration_log: string
          rec_opus_id: string
        }[]
      }
      remove_admin_user: { Args: { target_user_id: string }; Returns: boolean }
      update_exploration_page:
        | {
            Args: {
              page_description?: string
              page_id: string
              page_nom: string
              page_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              page_config?: Json
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
      validate_admin_email_access: { Args: never; Returns: boolean }
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
