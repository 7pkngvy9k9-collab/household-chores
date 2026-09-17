import { createClient } from "@supabase/supabase-js";

import { supabaseAnonKey, supabaseUrl } from "./config";
import type { Database } from "./database.types";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
