import { pluginElectron } from 'rsbuild-plugin-electron';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [pluginElectron(), pluginReact()],
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
