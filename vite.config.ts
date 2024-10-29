import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
    tsconfigPaths()
  ],
  server: {
    port: 3005,
    host: "localhost",
    hmr: {
      port: 3005 // Add this to match the server port
    },
    watch: {
      usePolling: true  // Add this for better file watching
    }
  },
});