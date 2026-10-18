import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false, 
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ["default"],
  },
  resolve: {
    alias: {
      // Use import.meta.dirname for ESM compatibility
      "@": resolve(import.meta.dirname, "src"),
    },
  },
});