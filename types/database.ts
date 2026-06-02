/**
 * Supabase database types.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  is_priority: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type TaskInsert = {
  id?: string;
  user_id: string;
  title: string;
  is_priority?: boolean;
  is_complete?: boolean;
  completed_at?: string | null;
};

export type TaskUpdate = {
  title?: string;
  is_priority?: boolean;
  is_complete?: boolean;
  completed_at?: string | null;
};

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: TaskRow;
        Insert: TaskInsert;
        Update: TaskUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
