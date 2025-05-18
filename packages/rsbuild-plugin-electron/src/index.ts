import type { RsbuildDevServer, RsbuildPlugin } from '@rsbuild/core';
import { resolveServerUrl, treeKillSync } from './utils.js';

export const PLUGIN_ELECTRON_NAME = 'rsbuild-plugin-electron';

export const pluginElectron = (): RsbuildPlugin => ({
  name: PLUGIN_ELECTRON_NAME,

  setup(api) {
    // rsbuild dev

    let devServer: RsbuildDevServer;
    api.onBeforeStartDevServer(({ server }) => {
      devServer = server;
    });
    api.onAfterStartDevServer(() => {
      const rsbuildConfig = api.getNormalizedConfig();
      // because at the same runtime
      Object.assign(process.env, {
        RSBUILD_DEV_SERVER_URL: resolveServerUrl(devServer, rsbuildConfig),
      });
    });

    api.onAfterEnvironmentCompile(({ isWatch }) => {
      if (isWatch) {
        startup();
      }
    });

    // rsbuild build

    api.onAfterBuild(() => {});
  },
});

/**
 * Electron App startup function.
 * It will mount the Electron App child-process to `process.electronApp`.
 * @param argv default value `['./packer', '--no-sandbox']`
 * @param options options for `child_process.spawn`
 * @param customElectronPkg custom electron package name (default: 'electron')
 */
export async function startup(
  argv = ['./packer', '--no-sandbox'],
  options?: import('node:child_process').SpawnOptions,
  customElectronPkg?: string,
) {
  const { spawn } = await import('node:child_process');
  const electron = await import(customElectronPkg ?? 'electron');
  const electronPath = electron.default ?? electron;

  await startup.exit();

  // Start Electron.app
  process.electronApp = spawn(electronPath, argv, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    ...options,
  });

  // Exit command after Electron.app exits
  process.electronApp.once('exit', process.exit);

  if (!startup.hookedProcessExit) {
    startup.hookedProcessExit = true;
    process.once('exit', startup.exit);
  }
}

startup.send = (message: string) => {
  const p = process.electronApp;
  if (p) {
    // Based on { stdio: [,,, 'ipc'] }
    p.send(message);
  }
};

startup.hookedProcessExit = false;
startup.exit = async () => {
  const p = process.electronApp;
  if (p) {
    await new Promise((resolve) => {
      p.removeAllListeners();
      p.once('exit', resolve);

      if (p.pid) {
        treeKillSync(p.pid);
      }
    });
  }
};
