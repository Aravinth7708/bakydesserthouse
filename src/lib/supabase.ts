import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ludzqorbewymznheeckw.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZHpxb3JiZXd5bXpuaGVlY2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTE5NzIsImV4cCI6MjA5ODY2Nzk3Mn0.cUPXpduCrLRNWw7dkbIlLL33UGQmdbRw4cgNNgYjyUk";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("your-project-id") &&
    !SUPABASE_ANON_KEY.includes("your-anon-key"),
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
