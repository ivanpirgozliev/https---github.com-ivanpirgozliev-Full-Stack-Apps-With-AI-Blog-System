import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // "server-only" throws outside RSC — replace with empty module in tests
      "server-only": path.resolve(__dirname, "src/__mocks__/server-only.ts"),
      "@": path.resolve(__dirname, "src"),
      "@blog/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
