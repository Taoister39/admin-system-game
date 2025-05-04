import type { RsbuildPlugin } from '@rsbuild/core';
import { resolveServerUrl } from 'src/utils.js';

export type PluginElectronOptions = {
  main: unknown;
  preload?: unknown;
  renderer?: unknown;
};

export const PLUGIN_ELECTRON_NAME = 'rsbuild-plugin-electron';

export const pluginElectron = (
  options: PluginElectronOptions,
): RsbuildPlugin => ({
  name: PLUGIN_ELECTRON_NAME,

  setup(api) {
    console.log('Hello Rsbuild!', options);
    // rsbuild dev

    const rsbuildConfig = api.getNormalizedConfig();

    api.onBeforeStartDevServer((params) => {
      console.log('onBeforeStartDevServer', params);
      Object.assign(process.env, {
        RSBUILD_DEV_SERVER_URL: resolveServerUrl(params.server, rsbuildConfig),
      });
    });
    api.onAfterStartDevServer((params) => {
      console.log('onAfterStartDevServer', params);
    });

    // rsbuild build

    api.onAfterBuild(() => {});
  },
});
