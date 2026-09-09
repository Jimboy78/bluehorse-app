export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      adaptation_proposals: {
        Row: {
          created_at: string
          from_value: string | null
          id: string
          load_unit: Database["public"]["Enums"]["load_unit"] | null
          plan_id: string
          reason_code: string
          reason_text: string
          resolved_at: string | null
          ruleset_version: string
          status: Database["public"]["Enums"]["proposal_status"]
          target_ref: Json
          to_value: string | null
          type: Database["public"]["Enums"]["proposal_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          from_value?: string | null
          id?: string
          load_unit?: Database["public"]["Enums"]["load_unit"] | null
          plan_id: string
          reason_code: string
          reason_text: string
          resolved_at?: string | null
          ruleset_version: string
          status?: Database["public"]["Enums"]["proposal_status"]
          target_ref: Json
          to_value?: string | null
          type: Database["public"]["Enums"]["proposal_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          from_value?: string | null
          id?: string
          load_unit?: Database["public"]["Enums"]["load_unit"] | null
          plan_id?: string
          reason_code?: string
          reason_text?: string
          resolved_at?: string | null
          ruleset_version?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          target_ref?: Json
          to_value?: string | null
          type?: Database["public"]["Enums"]["proposal_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adaptation_proposals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptation_proposals_ruleset_version_fkey"
            columns: ["ruleset_version"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "adaptation_proposals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_metrics: {
        Row: {
          gym_id: string
          height_cm: number | null
          id: string
          recorded_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          gym_id: string
          height_cm?: number | null
          id?: string
          recorded_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          gym_id?: string
          height_cm?: number | null
          id?: string
          recorded_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_metrics_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          base_weight_kg: number | null
          brand: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          created_at: string
          gym_id: string
          id: string
          is_active: boolean
          load_increment: number | null
          load_max: number | null
          load_min: number | null
          load_unit: Database["public"]["Enums"]["load_unit"]
          location_note: string | null
          model: string | null
          name: string
          photo_url: string | null
          quantity: number
          setup_notes: string | null
          stack_kg: number[] | null
        }
        Insert: {
          base_weight_kg?: number | null
          brand?: string | null
          category: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          gym_id: string
          id?: string
          is_active?: boolean
          load_increment?: number | null
          load_max?: number | null
          load_min?: number | null
          load_unit: Database["public"]["Enums"]["load_unit"]
          location_note?: string | null
          model?: string | null
          name: string
          photo_url?: string | null
          quantity?: number
          setup_notes?: string | null
          stack_kg?: number[] | null
        }
        Update: {
          base_weight_kg?: number | null
          brand?: string | null
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string
          gym_id?: string
          id?: string
          is_active?: boolean
          load_increment?: number | null
          load_max?: number | null
          load_min?: number | null
          load_unit?: Database["public"]["Enums"]["load_unit"]
          location_note?: string | null
          model?: string | null
          name?: string
          photo_url?: string | null
          quantity?: number
          setup_notes?: string | null
          stack_kg?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_equipment: {
        Row: {
          equipment_id: string
          exercise_id: string
          is_primary: boolean
        }
        Insert: {
          equipment_id: string
          exercise_id: string
          is_primary?: boolean
        }
        Update: {
          equipment_id?: string
          exercise_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercise_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_equipment_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_substitutions: {
        Row: {
          equivalence: number
          exercise_id: string
          note: string | null
          substitute_id: string
        }
        Insert: {
          equivalence: number
          exercise_id: string
          note?: string | null
          substitute_id: string
        }
        Update: {
          equivalence?: number
          exercise_id?: string
          note?: string | null
          substitute_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_substitutions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitutions_substitute_id_fkey"
            columns: ["substitute_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          cues: string | null
          gym_id: string | null
          id: string
          is_active: boolean
          is_compound: boolean
          is_explosive: boolean
          is_unilateral: boolean
          media_url: string | null
          modality: Database["public"]["Enums"]["exercise_modality"]
          name: string
          pattern: Database["public"]["Enums"]["movement_pattern"]
          primary_muscles: Database["public"]["Enums"]["muscle_group"][]
          secondary_muscles: Database["public"]["Enums"]["muscle_group"][]
          skill_level: Database["public"]["Enums"]["experience_level"]
        }
        Insert: {
          created_at?: string
          cues?: string | null
          gym_id?: string | null
          id?: string
          is_active?: boolean
          is_compound?: boolean
          is_explosive?: boolean
          is_unilateral?: boolean
          media_url?: string | null
          modality?: Database["public"]["Enums"]["exercise_modality"]
          name: string
          pattern: Database["public"]["Enums"]["movement_pattern"]
          primary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          secondary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          skill_level?: Database["public"]["Enums"]["experience_level"]
        }
        Update: {
          created_at?: string
          cues?: string | null
          gym_id?: string | null
          id?: string
          is_active?: boolean
          is_compound?: boolean
          is_explosive?: boolean
          is_unilateral?: boolean
          media_url?: string | null
          modality?: Database["public"]["Enums"]["exercise_modality"]
          name?: string
          pattern?: Database["public"]["Enums"]["movement_pattern"]
          primary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          secondary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          skill_level?: Database["public"]["Enums"]["experience_level"]
        }
        Relationships: [
          {
            foreignKeyName: "exercises_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          created_at: string
          id: string
          join_code: string | null
          name: string
          slug: string
          timezone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          join_code?: string | null
          name: string
          slug: string
          timezone?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          join_code?: string | null
          name?: string
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      health_screenings: {
        Row: {
          answers: Json
          cleared: boolean
          created_at: string
          disclaimer_accepted_at: string | null
          id: string
          ruleset_version: string
          user_id: string
        }
        Insert: {
          answers: Json
          cleared: boolean
          created_at?: string
          disclaimer_accepted_at?: string | null
          id?: string
          ruleset_version: string
          user_id: string
        }
        Update: {
          answers?: Json
          cleared?: boolean
          created_at?: string
          disclaimer_accepted_at?: string | null
          id?: string
          ruleset_version?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_screenings_ruleset_version_fkey"
            columns: ["ruleset_version"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "health_screenings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_reports: {
        Row: {
          body_region: Database["public"]["Enums"]["body_region"]
          exercise_id: string | null
          id: string
          note: string | null
          reported_at: string
          severity: number
          user_id: string
          workout_log_id: string | null
        }
        Insert: {
          body_region: Database["public"]["Enums"]["body_region"]
          exercise_id?: string | null
          id?: string
          note?: string | null
          reported_at?: string
          severity: number
          user_id: string
          workout_log_id?: string | null
        }
        Update: {
          body_region?: Database["public"]["Enums"]["body_region"]
          exercise_id?: string | null
          id?: string
          note?: string | null
          reported_at?: string
          severity?: number
          user_id?: string
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_reports_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_reports_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          exercise_id: string
          id: string
          set_log_id: string | null
          type: string
          user_id: string
          value: number
        }
        Insert: {
          achieved_at?: string
          exercise_id: string
          id?: string
          set_log_id?: string | null
          type: string
          user_id: string
          value: number
        }
        Update: {
          achieved_at?: string
          exercise_id?: string
          id?: string
          set_log_id?: string | null
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_set_log_id_fkey"
            columns: ["set_log_id"]
            isOneToOne: false
            referencedRelation: "set_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_session_items: {
        Row: {
          equipment_id: string | null
          exercise_id: string
          id: string
          is_placeholder: boolean
          order_index: number
          plan_session_id: string
          rationale: string
          rest_seconds: number
          superset_group: number | null
          target_duration_seconds: number | null
          target_intensity_zone: number | null
          target_interval_rest_seconds: number | null
          target_load: number | null
          target_load_unit: Database["public"]["Enums"]["load_unit"] | null
          target_reps_max: number
          target_reps_min: number
          target_rir: number | null
          target_sets: number
        }
        Insert: {
          equipment_id?: string | null
          exercise_id: string
          id?: string
          is_placeholder?: boolean
          order_index: number
          plan_session_id: string
          rationale: string
          rest_seconds: number
          superset_group?: number | null
          target_duration_seconds?: number | null
          target_intensity_zone?: number | null
          target_interval_rest_seconds?: number | null
          target_load?: number | null
          target_load_unit?: Database["public"]["Enums"]["load_unit"] | null
          target_reps_max: number
          target_reps_min: number
          target_rir?: number | null
          target_sets: number
        }
        Update: {
          equipment_id?: string | null
          exercise_id?: string
          id?: string
          is_placeholder?: boolean
          order_index?: number
          plan_session_id?: string
          rationale?: string
          rest_seconds?: number
          superset_group?: number | null
          target_duration_seconds?: number | null
          target_intensity_zone?: number | null
          target_interval_rest_seconds?: number | null
          target_load?: number | null
          target_load_unit?: Database["public"]["Enums"]["load_unit"] | null
          target_reps_max?: number
          target_reps_min?: number
          target_rir?: number | null
          target_sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_session_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_session_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_session_items_plan_session_id_fkey"
            columns: ["plan_session_id"]
            isOneToOne: false
            referencedRelation: "plan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_sessions: {
        Row: {
          completed_at: string | null
          estimated_minutes: number
          focus: string
          id: string
          label: string
          plan_id: string
          sequence_index: number
          status: Database["public"]["Enums"]["session_status"]
        }
        Insert: {
          completed_at?: string | null
          estimated_minutes: number
          focus: string
          id?: string
          label: string
          plan_id: string
          sequence_index: number
          status?: Database["public"]["Enums"]["session_status"]
        }
        Update: {
          completed_at?: string | null
          estimated_minutes?: number
          focus?: string
          id?: string
          label?: string
          plan_id?: string
          sequence_index?: number
          status?: Database["public"]["Enums"]["session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          generated_at: string
          goal_snapshot: Json
          gym_id: string
          id: string
          name: string | null
          ruleset_version: string
          status: string
          template_id: string
          user_id: string
          warnings: string[]
        }
        Insert: {
          generated_at?: string
          goal_snapshot: Json
          gym_id: string
          id?: string
          name?: string | null
          ruleset_version: string
          status?: string
          template_id: string
          user_id: string
          warnings?: string[]
        }
        Update: {
          generated_at?: string
          goal_snapshot?: Json
          gym_id?: string
          id?: string
          name?: string | null
          ruleset_version?: string
          status?: string
          template_id?: string
          user_id?: string
          warnings?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_ruleset_version_fkey"
            columns: ["ruleset_version"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          display_name: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          gym_id: string
          id: string
          onboarded_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          sex: Database["public"]["Enums"]["sex"]
          units_preference: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          display_name: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          gym_id: string
          id: string
          onboarded_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          sex?: Database["public"]["Enums"]["sex"]
          units_preference?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          display_name?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          gym_id?: string
          id?: string
          onboarded_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          sex?: Database["public"]["Enums"]["sex"]
          units_preference?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      rulesets: {
        Row: {
          content: Json
          created_at: string
          is_active: boolean
          notes: string | null
          source: Database["public"]["Enums"]["ruleset_source"]
          version: string
        }
        Insert: {
          content: Json
          created_at?: string
          is_active?: boolean
          notes?: string | null
          source: Database["public"]["Enums"]["ruleset_source"]
          version: string
        }
        Update: {
          content?: Json
          created_at?: string
          is_active?: boolean
          notes?: string | null
          source?: Database["public"]["Enums"]["ruleset_source"]
          version?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          id: string
          occurred_at: string
          payload: Json
          type: string
          workout_log_id: string
        }
        Insert: {
          id?: string
          occurred_at?: string
          payload?: Json
          type: string
          workout_log_id: string
        }
        Update: {
          id?: string
          occurred_at?: string
          payload?: Json
          type?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          client_id: string
          completed_at: string
          distance_meters: number | null
          duration_seconds: number | null
          equipment_id: string | null
          exercise_id: string
          id: string
          is_warmup: boolean
          load_kg_normalized: number | null
          load_unit: Database["public"]["Enums"]["load_unit"] | null
          load_value: number | null
          plan_session_item_id: string | null
          reps: number | null
          reps_target: number | null
          rest_actual_seconds: number | null
          rest_prescribed_seconds: number | null
          rir: number | null
          set_index: number
          workout_log_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          equipment_id?: string | null
          exercise_id: string
          id?: string
          is_warmup?: boolean
          load_kg_normalized?: number | null
          load_unit?: Database["public"]["Enums"]["load_unit"] | null
          load_value?: number | null
          plan_session_item_id?: string | null
          reps?: number | null
          reps_target?: number | null
          rest_actual_seconds?: number | null
          rest_prescribed_seconds?: number | null
          rir?: number | null
          set_index: number
          workout_log_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          equipment_id?: string | null
          exercise_id?: string
          id?: string
          is_warmup?: boolean
          load_kg_normalized?: number | null
          load_unit?: Database["public"]["Enums"]["load_unit"] | null
          load_value?: number | null
          plan_session_item_id?: string | null
          reps?: number | null
          reps_target?: number | null
          rest_actual_seconds?: number | null
          rest_prescribed_seconds?: number | null
          rir?: number | null
          set_index?: number
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_plan_session_item_id_fkey"
            columns: ["plan_session_item_id"]
            isOneToOne: false
            referencedRelation: "plan_session_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_baselines: {
        Row: {
          exercise_id: string
          id: string
          load_kg_normalized: number | null
          load_unit: Database["public"]["Enums"]["load_unit"]
          load_value: number | null
          recorded_at: string
          reps: number | null
          source: Database["public"]["Enums"]["baseline_source"]
          user_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          load_kg_normalized?: number | null
          load_unit: Database["public"]["Enums"]["load_unit"]
          load_value?: number | null
          recorded_at?: string
          reps?: number | null
          source: Database["public"]["Enums"]["baseline_source"]
          user_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          load_kg_normalized?: number | null
          load_unit?: Database["public"]["Enums"]["load_unit"]
          load_value?: number | null
          recorded_at?: string
          reps?: number | null
          source?: Database["public"]["Enums"]["baseline_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_baselines_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_baselines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_constraints: {
        Row: {
          active_from: string
          active_to: string | null
          body_region: Database["public"]["Enums"]["body_region"] | null
          equipment_id: string | null
          exercise_id: string | null
          id: string
          note: string | null
          severity: number
          type: Database["public"]["Enums"]["constraint_type"]
          user_id: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          body_region?: Database["public"]["Enums"]["body_region"] | null
          equipment_id?: string | null
          exercise_id?: string | null
          id?: string
          note?: string | null
          severity?: number
          type: Database["public"]["Enums"]["constraint_type"]
          user_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          body_region?: Database["public"]["Enums"]["body_region"] | null
          equipment_id?: string | null
          exercise_id?: string | null
          id?: string
          note?: string | null
          severity?: number
          type?: Database["public"]["Enums"]["constraint_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_constraints_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_constraints_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_constraints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_equipment_settings: {
        Row: {
          equipment_id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          equipment_id: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          equipment_id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_settings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_equipment_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          goal: Database["public"]["Enums"]["training_goal"]
          id: string
          is_active: boolean
          priority: number
          season_phase: Database["public"]["Enums"]["season_phase"]
          session_minutes_target: number
          sessions_per_week_target: number
          sport: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          goal: Database["public"]["Enums"]["training_goal"]
          id?: string
          is_active?: boolean
          priority?: number
          season_phase?: Database["public"]["Enums"]["season_phase"]
          session_minutes_target?: number
          sessions_per_week_target: number
          sport?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          goal?: Database["public"]["Enums"]["training_goal"]
          id?: string
          is_active?: boolean
          priority?: number
          season_phase?: Database["public"]["Enums"]["season_phase"]
          session_minutes_target?: number
          sessions_per_week_target?: number
          sport?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          client_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          plan_session_id: string | null
          pre_energy: number | null
          pre_sleep: number | null
          session_feel: Database["public"]["Enums"]["session_feel"] | null
          session_rpe: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          plan_session_id?: string | null
          pre_energy?: number | null
          pre_sleep?: number | null
          session_feel?: Database["public"]["Enums"]["session_feel"] | null
          session_rpe?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          plan_session_id?: string | null
          pre_energy?: number | null
          pre_sleep?: number | null
          session_feel?: Database["public"]["Enums"]["session_feel"] | null
          session_rpe?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_session_id_fkey"
            columns: ["plan_session_id"]
            isOneToOne: false
            referencedRelation: "plan_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_user_id_fkey"
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
      current_gym_id: { Args: never; Returns: string }
      dearmor: { Args: { "": string }; Returns: string }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      is_gym_admin: { Args: never; Returns: boolean }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
    }
    Enums: {
      baseline_source: "declared" | "calibrated" | "estimated"
      body_region:
        | "neck"
        | "shoulder"
        | "elbow"
        | "wrist"
        | "upper_back"
        | "lower_back"
        | "hip"
        | "knee"
        | "ankle"
        | "other"
      constraint_type: "injury" | "pain" | "avoid_exercise" | "avoid_equipment"
      equipment_category:
        | "selectorized"
        | "plate_loaded"
        | "free_weight"
        | "rack"
        | "cardio"
        | "bodyweight"
        | "accessory"
      exercise_modality: "reps_weight" | "reps_bodyweight" | "time" | "distance"
      experience_level: "beginner" | "novice" | "intermediate" | "advanced"
      load_unit:
        | "kg"
        | "lb"
        | "stack_level"
        | "plates_kg"
        | "plates_lb"
        | "band"
        | "bodyweight"
        | "none"
      member_role: "member" | "staff" | "admin"
      movement_pattern:
        | "squat"
        | "hinge"
        | "lunge"
        | "horizontal_push"
        | "horizontal_pull"
        | "vertical_push"
        | "vertical_pull"
        | "carry"
        | "core"
        | "isolation"
        | "cardio"
      muscle_group:
        | "quads"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "chest"
        | "back"
        | "lats"
        | "traps"
        | "front_delts"
        | "side_delts"
        | "rear_delts"
        | "biceps"
        | "triceps"
        | "forearms"
        | "abs"
        | "obliques"
        | "lower_back"
        | "full_body"
      proposal_status: "pending" | "accepted" | "rejected" | "expired"
      proposal_type:
        | "load_increase"
        | "load_decrease"
        | "deload"
        | "swap_exercise"
        | "volume_change"
      ruleset_source: "placeholder" | "research"
      season_phase: "preseason" | "in_season" | "off_season" | "none"
      session_feel: "easy" | "right" | "hard"
      session_status: "pending" | "in_progress" | "completed" | "skipped"
      sex: "female" | "male" | "other" | "undisclosed"
      training_goal:
        | "strength"
        | "hypertrophy"
        | "power"
        | "cardio"
        | "endurance"
        | "recomposition"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      baseline_source: ["declared", "calibrated", "estimated"],
      body_region: [
        "neck",
        "shoulder",
        "elbow",
        "wrist",
        "upper_back",
        "lower_back",
        "hip",
        "knee",
        "ankle",
        "other",
      ],
      constraint_type: ["injury", "pain", "avoid_exercise", "avoid_equipment"],
      equipment_category: [
        "selectorized",
        "plate_loaded",
        "free_weight",
        "rack",
        "cardio",
        "bodyweight",
        "accessory",
      ],
      exercise_modality: ["reps_weight", "reps_bodyweight", "time", "distance"],
      experience_level: ["beginner", "novice", "intermediate", "advanced"],
      load_unit: [
        "kg",
        "lb",
        "stack_level",
        "plates_kg",
        "plates_lb",
        "band",
        "bodyweight",
        "none",
      ],
      member_role: ["member", "staff", "admin"],
      movement_pattern: [
        "squat",
        "hinge",
        "lunge",
        "horizontal_push",
        "horizontal_pull",
        "vertical_push",
        "vertical_pull",
        "carry",
        "core",
        "isolation",
        "cardio",
      ],
      muscle_group: [
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "chest",
        "back",
        "lats",
        "traps",
        "front_delts",
        "side_delts",
        "rear_delts",
        "biceps",
        "triceps",
        "forearms",
        "abs",
        "obliques",
        "lower_back",
        "full_body",
      ],
      proposal_status: ["pending", "accepted", "rejected", "expired"],
      proposal_type: [
        "load_increase",
        "load_decrease",
        "deload",
        "swap_exercise",
        "volume_change",
      ],
      ruleset_source: ["placeholder", "research"],
      season_phase: ["preseason", "in_season", "off_season", "none"],
      session_feel: ["easy", "right", "hard"],
      session_status: ["pending", "in_progress", "completed", "skipped"],
      sex: ["female", "male", "other", "undisclosed"],
      training_goal: [
        "strength",
        "hypertrophy",
        "power",
        "cardio",
        "endurance",
        "recomposition",
      ],
    },
  },
} as const

