import path from "node:path";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * The `tfhe` package loads its WASM via `new URL('tfhe_bg.wasm', import.meta.url)`.
 * In dev mode with pnpm, the WASM file lives deep in the .pnpm store and the relative
 * URL resolution fails. This plugin copies it to `public/` so it's always reachable.
 */
function cofheWasmPlugin(): Plugin {
  return {
    name: "cofhe-wasm",
    buildStart() {
      const publicDir = path.resolve(__dirname, "public");
      const dest = path.resolve(publicDir, "tfhe_bg.wasm");
      if (existsSync(dest)) return;

      // Search candidate locations (direct, hoisted, pnpm store)
      const root = path.resolve(__dirname, "../../../..");
      const candidates = [
        path.resolve(__dirname, "node_modules/tfhe/tfhe_bg.wasm"),
        path.resolve(__dirname, "../../node_modules/tfhe/tfhe_bg.wasm"),
        path.resolve(root, "node_modules/tfhe/tfhe_bg.wasm"),
      ];

      // Also search pnpm store
      const pnpmDir = path.resolve(root, "node_modules/.pnpm");
      if (existsSync(pnpmDir)) {
        for (const entry of readdirSync(pnpmDir)) {
          if (entry.startsWith("tfhe@")) {
            candidates.push(
              path.resolve(
                pnpmDir,
                entry,
                "node_modules/tfhe/tfhe_bg.wasm",
              ),
            );
          }
        }
      }

      const src = candidates.find((c) => existsSync(c));
      if (src) {
        if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
        copyFileSync(src, dest);
      }
    },
  };
}

export default defineConfig({
  plugins: [cofheWasmPlugin(), tailwindcss(), tanstackRouter({}), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["tfhe"],
  },
  worker: {
    format: "es",
  },
  server: {
    port: 3001,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
