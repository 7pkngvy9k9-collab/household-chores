// Publishable Supabase credentials. The anon key is designed to be visible in
// the browser; row level security is what actually protects household data.
export const supabaseUrl = "https://ezdmzygqkegevlzbmnko.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZG16eWdxa2VnZXZsemJtbmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTIxNzQsImV4cCI6MjEwNTA2ODE3NH0.bAZ6Gf-JC-QG5Oib-BVCcNnVqSl1ocXC34GZzxTf8CY";

// Where Supabase should send users after they confirm a sign-up email. Must be
// listed under Authentication → URL configuration → Redirect URLs.
export const siteUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
