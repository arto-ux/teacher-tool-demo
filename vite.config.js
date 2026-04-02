import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3030,
    /** If 3030 is taken (e.g. another `pnpm start`), use the next free port. */
    strictPort: false,
    headers: { "Cache-Control": "no-store" },
  },
});
