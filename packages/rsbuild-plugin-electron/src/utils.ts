import cp from 'node:child_process';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { NormalizedConfig, RsbuildDevServer } from '@rsbuild/core';

export function resolveServerUrl(
  server: RsbuildDevServer,
  options: NormalizedConfig,
) {
  const addressInfo = server.httpServer?.address();
  const isAddressInfo = (x: typeof addressInfo): x is AddressInfo =>
    typeof x === 'object' && x !== null && 'address' in x;

  if (isAddressInfo(addressInfo)) {
    const { address, port } = addressInfo;
    const hostname = resolveHostname(address);

    const protocol = options.server.https ? 'https' : 'http';
    const devBase = options.server.base;

    const path =
      typeof options.server?.open === 'string' ? options.server.open : devBase;
    const url = path.startsWith('http')
      ? path
      : `${protocol}://${hostname}:${port}${path}`;

    return url;
  }
}

export function resolvePackageJson<T>(root = process.cwd()): T | null {
  const packageJsonPath = path.join(root, 'package.json');
  const packageJsonStr = fs.readFileSync(packageJsonPath, 'utf8');
  try {
    return JSON.parse(packageJsonStr);
  } catch {
    return null;
  }
}

/**
 * @see https://github.com/web-infra-dev/rsbuild/blob/main/packages/core/src/server/helper.ts#L352-L371
 */
export const resolveHostname = (hostname: string) =>
  isLoopbackHost(hostname) || isWildcardHost(hostname) ? 'localhost' : hostname;

const isWildcardHost = (host: string): boolean => {
  const wildcardHosts = new Set([
    '0.0.0.0',
    '::',
    '0000:0000:0000:0000:0000:0000:0000:0000',
  ]);
  return wildcardHosts.has(host);
};

const isLoopbackHost = (host: string) => {
  const loopbackHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    '0000:0000:0000:0000:0000:0000:0000:0001',
  ]);
  return loopbackHosts.has(host);
};

/**
 * Inspired `tree-kill`, implemented based on sync-api. #168
 * @see https://github.com/pkrumins/node-tree-kill/blob/v1.2.2/index.js
 */
export function treeKillSync(pid: number) {
  if (process.platform === 'win32') {
    cp.execSync(`taskkill /pid ${pid} /T /F`);
  } else {
    killTree(pidTree({ pid, ppid: process.pid }));
  }
}

export interface PidTree {
  pid: number;
  ppid: number;
  children?: PidTree[];
}

function pidTree(tree: PidTree) {
  const command =
    process.platform === 'darwin'
      ? `pgrep -P ${tree.pid}` // Mac
      : `ps -o pid --no-headers --ppid ${tree.ppid}`; // Linux

  try {
    const childs = cp
      .execSync(command, { encoding: 'utf8' })
      .match(/\d+/g)
      ?.map((id) => +id);

    if (childs) {
      tree.children = childs.map((cid) =>
        pidTree({ pid: cid, ppid: tree.pid }),
      );
    }
  } catch {}

  return tree;
}

function killTree(tree: PidTree) {
  if (tree.children) {
    for (const child of tree.children) {
      killTree(child);
    }
  }

  try {
    process.kill(tree.pid); // #214
  } catch {
    /* empty */
  }
}
