import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://ludzqorbewymznheeckw.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZHpxb3JiZXd5bXpuaGVlY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTE5NzIsImV4cCI6MjA5ODY2Nzk3Mn0.cUPXpduCrLRNWw7dkbIlLL33UGQmdbRw4cgNNgYjyUk";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project-id") &&
    !supabaseAnonKey.includes("your-anon-key"),
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
