import type {
  NormalizedConfig,
  RsbuildConfig,
  RsbuildDevServer,
} from '@rsbuild/core';
import type { AddressInfo } from 'node:net';

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
