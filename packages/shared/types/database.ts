export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          age: number | null;
          gender: 'male' | 'female' | 'other' | null;
          instagram_handle: string | null;
          latitude: number | null;
          longitude: number | null;
          radius_km: number;
          avatar_url: string | null;
          created_at: string;
          onboarding_complete: boolean;
          is_admin: boolean;
          is_banned: boolean;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          instagram_handle?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          radius_km?: number;
          avatar_url?: string | null;
          created_at?: string;
          onboarding_complete?: boolean;
          is_admin?: boolean;
          is_banned?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          instagram_handle?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          radius_km?: number;
          avatar_url?: string | null;
          created_at?: string;
          onboarding_complete?: boolean;
          is_admin?: boolean;
          is_banned?: boolean;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          venue: string;
          description: string | null;
          address: string | null;
          image_url: string | null;
          event_date: string;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          venue: string;
          description?: string | null;
          address?: string | null;
          image_url?: string | null;
          event_date: string;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          venue?: string;
          description?: string | null;
          address?: string | null;
          image_url?: string | null;
          event_date?: string;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      parties: {
        Row: {
          id: string;
          event_id: string;
          host_id: string;
          type: 'pre' | 'after';
          title: string;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          min_age: number;
          max_age: number;
          max_capacity: number | null;
          start_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          host_id: string;
          type: 'pre' | 'after';
          title: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          min_age?: number;
          max_age?: number;
          max_capacity?: number | null;
          start_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          host_id?: string;
          type?: 'pre' | 'after';
          title?: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          min_age?: number;
          max_age?: number;
          max_capacity?: number | null;
          start_time?: string;
          created_at?: string;
        };
      };
      party_attendees: {
        Row: {
          party_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          party_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          party_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          party_id: string;
          reason: 'inappropriate' | 'spam' | 'fake' | 'harassment' | 'other';
          description: string | null;
          status: 'pending' | 'reviewed' | 'dismissed';
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          party_id: string;
          reason: 'inappropriate' | 'spam' | 'fake' | 'harassment' | 'other';
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'dismissed';
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          party_id?: string;
          reason?: 'inappropriate' | 'spam' | 'fake' | 'harassment' | 'other';
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'dismissed';
          created_at?: string;
          reviewed_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Party = Database['public']['Tables']['parties']['Row'];
export type PartyAttendee = Database['public']['Tables']['party_attendees']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];

export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type PartyInsert = Database['public']['Tables']['parties']['Insert'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];

export type PartyWithDetails = Party & {
  host: User;
  attendees: (PartyAttendee & { user: User })[];
  attendee_count: number;
  male_count: number;
  female_count: number;
};

export type EventWithPartyCount = Event & {
  pre_party_count: number;
  after_party_count: number;
};
