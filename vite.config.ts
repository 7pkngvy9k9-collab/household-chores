import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<user>.github.io/household-chores/, so assets and routes
// need the repository name as their base path.
export default defineConfig({
  plugins: [react()],
  base: "/household-chores/",
});
