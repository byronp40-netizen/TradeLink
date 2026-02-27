// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * These MUST exist in:
 *  - .env.local (for dev)
 *  - Vercel Project Settings (for production)
 *
 * And MUST start with VITE_ so Vite exposes them to the browser
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Helpful developer error (prevents silent white screen confusion later)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase env vars missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);