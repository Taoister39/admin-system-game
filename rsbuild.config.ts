import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./src/renderer/index.tsx",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
});
