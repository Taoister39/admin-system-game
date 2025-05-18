import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginElectron } from 'rsbuild-plugin-electron';

export default defineConfig({
  server: {
    port: 7712,
    printUrls(params) {
      const home = params.routes.find((route) => route.entryName === 'index');

      // TODO: The pathname always distPath
      if (home) {
        home.pathname = '/';
      }

      return params.urls;
    },
  },
  environments: {
    web: {
      plugins: [pluginReact()],
      source: {
        entry: {
          index: './src/renderer/index.tsx',
        },
      },
      resolve: {
        alias: {
          '@': path.resolve('./src/renderer'),
        },
      },
      output: {
        distPath: {
          root: './packer/dist',
        },
      },
    },
    node: {
      plugins: [pluginElectron()],
      resolve: {
        alias: {
          '@main': path.resolve('./src/main'),
        },
      },
      source: {
        entry: {
          main: './src/main/main.ts',
          preload: './src/main/preload.ts',
        },
      },
      dev: {
        writeToDisk: true,
      },
      output: {
        target: 'node',
        distPath: {
          root: './packer/dist-electron',
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
