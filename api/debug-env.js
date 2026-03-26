export default function handler(req, res) {
  return res.status(200).json({
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasViteSupabaseUrl: Boolean(process.env.VITE_SUPABASE_URL),
    hasViteAnonKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
  });
}