export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      captcha_categories: {
        Row: {
          id: string
          name: string
          description: string
          status: 'active' | 'inactive' | 'testing'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          status?: 'active' | 'inactive' | 'testing'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: 'active' | 'inactive' | 'testing'
          created_at?: string
          updated_at?: string
        }
      }
      captchas: {
        Row: {
          id: string
          name: string
          category_id: string
          description: string
          difficulty: 'easy' | 'medium' | 'hard'
          status: 'active' | 'inactive' | 'testing'
          success_rate: number
          bot_detection_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          description: string
          difficulty?: 'easy' | 'medium' | 'hard'
          status?: 'active' | 'inactive' | 'testing'
          success_rate?: number
          bot_detection_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          description?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          status?: 'active' | 'inactive' | 'testing'
          success_rate?: number
          bot_detection_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          company_name: string
          subscription_tier: 'free' | 'standard' | 'professional' | 'enterprise'
          domains: string[]
          api_key: string
          usage_limit: number
          current_usage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          subscription_tier?: 'free' | 'standard' | 'professional' | 'enterprise'
          domains?: string[]
          api_key?: string
          usage_limit?: number
          current_usage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          subscription_tier?: 'free' | 'standard' | 'professional' | 'enterprise'
          domains?: string[]
          api_key?: string
          usage_limit?: number
          current_usage?: number
          created_at?: string
          updated_at?: string
        }
      }
      verification_logs: {
        Row: {
          id: string
          client_id: string
          captcha_id: string | null
          ip_address: string
          user_agent: string
          risk_score: number
          verification_result: boolean
          verification_time: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          captcha_id?: string | null
          ip_address: string
          user_agent: string
          risk_score: number
          verification_result: boolean
          verification_time: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          captcha_id?: string | null
          ip_address?: string
          user_agent?: string
          risk_score?: number
          verification_result?: boolean
          verification_time?: number
          created_at?: string
        }
      }
      client_settings: {
        Row: {
          id: string
          client_id: string
          risk_threshold: number
          challenge_difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
          preferred_captcha_types: string[]
          behavioral_analysis_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          risk_threshold?: number
          challenge_difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive'
          preferred_captcha_types?: string[]
          behavioral_analysis_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          risk_threshold?: number
          challenge_difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive'
          preferred_captcha_types?: string[]
          behavioral_analysis_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}