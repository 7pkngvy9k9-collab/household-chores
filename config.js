// Public publishable keys — safe for the browser (RLS protects data).
window.APP_CONFIG = {
  supabaseUrl: "https://ezdmzygqkegevlzbmnko.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZG16eWdxa2VnZXZsemJtbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTIxNzQsImV4cCI6MjEwNTA2ODE3NH0.bAZ6Gf-JC-QG5Oib-BVCcNnVqSl1ocXC34GZzxTf8CY",
  siteUrl: `${window.location.origin}${window.location.pathname.replace(/\/$/, "") || ""}`,
};
