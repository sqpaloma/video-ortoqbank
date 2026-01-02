import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],

    reporters: ["default", "html"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"], // 👈 ESSENCIAL
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "convex/",
        ".next/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.setup.ts",
      ],
    },
  },
});
