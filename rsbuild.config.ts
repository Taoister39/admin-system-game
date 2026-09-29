import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginElectron } from 'rsbuild-plugin-electron';

export default defineConfig({
  html: {
    title: '小镇事务所 · 管理系统经营游戏',
    meta: {
      'Content-Security-Policy': {
        'http-equiv': 'Content-Security-Policy',
        content: `default-src 'self'; script-src 'self'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws:; object-src 'none'; base-uri 'self'`,
      },
    },
  },
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
        assetPrefix: 'auto',
      },
    },
    node: {
      plugins: process.env.BROWSER_ONLY === '1' ? [] : [pluginElectron()],
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
        externals: ['electron'],
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
