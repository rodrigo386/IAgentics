import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // scripts/*.test.mjs são scripts de fumaça executados via `node`,
    // não suítes vitest (ver scripts/schema.test.mjs).
    exclude: [...configDefaults.exclude, "scripts/**"],
  },
});
