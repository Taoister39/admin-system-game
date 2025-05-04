import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginElectron } from 'rsbuild-plugin-electron';

export default defineConfig({
  plugins: [
    pluginElectron({
      main: {
        entry: './src/main/main.ts',
      },
      preload: './src/preload/preload.ts',
    }),
    pluginReact(),
  ],
  source: {
    entry: {
      index: './src/renderer/index.tsx',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
});
