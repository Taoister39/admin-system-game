import type { ChildProcess } from 'node:child_process';
import type { BuildOptions, RsbuildPlugin } from '@rsbuild/core';
import { resolveServerUrl, treeKillSync } from 'src/utils.js';

declare global {
  namespace NodeJS {
    interface Process {
      electronApp?: ChildProcess;
    }
  }
}

type InputOptions = string | string[] | Record<string, string>;

export type PluginElectronOptions = {
  main: ElectronOptions;
  preload?: {
    input: InputOptions;
  };
};

export interface ElectronOptions {
  /**
   * Shortcut of `build.lib.entry`
   */
  entry?: InputOptions;
  /**
   * Triggered when rsbuild dev` command
   *
   * If this `onstart` is passed, Electron App will not start automatically.
   * However, you can start Electron App via `startup` function.
   */
  onstart?: (args: {
    /**
     * Electron App startup function.
     * It will mount the Electron App child-process to `process.electronApp`.
     * @param argv default value `['.', '--no-sandbox']`
     * @param options options for `child_process.spawn`
     * @param customElectronPkg custom electron package name (default: 'electron')
     */
    startup: (
      argv?: string[],
      options?: import('node:child_process').SpawnOptions,
      customElectronPkg?: string,
    ) => Promise<void>;
    /** Reload Electron-Renderer */
    reload: () => void;
  }) => void | Promise<void>;
}

export const PLUGIN_ELECTRON_NAME = 'rsbuild-plugin-electron';

export const pluginElectron = (
  options: PluginElectronOptions,
): RsbuildPlugin => ({
  name: PLUGIN_ELECTRON_NAME,

  setup(api) {
    // rsbuild dev

    const flatRunner = [options.main];

    if (options.preload) {
      const runner: ElectronOptions = {
        onstart(args) {
          args.reload();
        },
      };
      flatRunner.push(runner);
    }

    api.onBeforeStartDevServer((params) => {
      const rsbuildConfig = api.getNormalizedConfig();

      // because at the same runtime
      Object.assign(process.env, {
        RSBUILD_DEV_SERVER_URL: resolveServerUrl(params.server, rsbuildConfig),
      });
    });
    api.onAfterStartDevServer((params) => {
      for (const runner of flatRunner) {
        if (runner.onstart) {
          runner.onstart.call(this, {
            startup,
            reload() {
              // TODO

              console.log('reload electron renderer');
            },
          });
        } else {
          startup();
        }
      }
    });

    // rsbuild build

    api.onAfterBuild(() => {});
  },
});

/**
 * Electron App startup function.
 * It will mount the Electron App child-process to `process.electronApp`.
 * @param argv default value `['.', '--no-sandbox']`
 * @param options options for `child_process.spawn`
 * @param customElectronPkg custom electron package name (default: 'electron')
 */
export async function startup(
  argv = ['.', '--no-sandbox'],
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
