import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginElectron } from 'rsbuild-plugin-electron';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve('./src/renderer'),
      '@main': path.resolve('./src/main'),
      '@common': path.resolve('./src/common'),
    },
  },
  dev: {
    writeToDisk: true,
  },
  server: {
    port: 7712,
  },
  environments: {
    web: {
      plugins: [pluginReact()],
      source: {
        entry: {
          index: './src/renderer/index.tsx',
        },
      },
      output: {
        target: 'web',
      },
    },
    node: {
      plugins: [pluginElectron()],
      source: {
        entry: {
          main: './src/main/main.ts',
          preload: './src/main/preload.ts',
        },
      },
      output: {
        target: 'node',
        distPath: {
          root: 'dist-electron',
        },
      },
      tools: {
        rspack: {
          target: ['electron-main', 'electron-preload'],
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'builtin:swc-loader',
                options: {
                  jsc: {
                    parser: {
                      syntax: 'typescript',
                    },
                  },
                },
                type: 'javascript/auto',
              },
            ],
          },
        },
      },
    },
  },
});
