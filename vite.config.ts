import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (!normalizedId.includes("/node_modules/")) return;
          if (/\/node_modules\/(react|react-dom|scheduler|react-is|use-sync-external-store)\//.test(normalizedId)) {
            return "react-vendor";
          }
          if (
            normalizedId.includes("/node_modules/@radix-ui/") ||
            normalizedId.includes("/node_modules/lucide-react/")
          ) {
            return "ui-vendor";
          }
          if (
            normalizedId.includes("/node_modules/@trpc/") ||
            normalizedId.includes("/node_modules/@tanstack/")
          ) {
            return "data-vendor";
          }
          if (
            normalizedId.includes("/node_modules/recharts/") ||
            normalizedId.includes("/node_modules/victory-vendor/") ||
            normalizedId.includes("/node_modules/recharts-scale/") ||
            normalizedId.includes("/node_modules/react-smooth/") ||
            normalizedId.includes("/node_modules/eventemitter3/") ||
            normalizedId.includes("/node_modules/tiny-invariant/") ||
            normalizedId.includes("/node_modules/lodash/")
          ) {
            return "charts-vendor";
          }
          return "vendor";
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
