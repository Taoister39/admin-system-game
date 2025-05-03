import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginElectronOptions = {
  message?: string;
};

export const PLUGIN_ELECTRON_NAME = 'rsbuild-plugin-electron';

export const pluginElectron = (
  options: PluginElectronOptions = {},
): RsbuildPlugin => ({
  name: 'plugin-electron',

  setup(api) {
    console.log('Hello Rsbuild!', options);
    api.onAfterStartDevServer(() => {
      const msg = options.message ?? 'hello!';
      console.log(msg);
    });
  },
});
