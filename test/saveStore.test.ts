import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test } from '@rstest/core';
import { initialGame, parseGameSave, transition } from '../src/common/game';
import { createSaveStore } from '../src/main/saveStore';

describe('桌面存档', () => {
  test('按顺序保存、保留前一次备份，损坏时不覆盖有效备份', async () => {
    const prefix = path.join(os.tmpdir(), 'town-office-test-');
    const directory = await mkdtemp(prefix);
    try {
      const store = createSaveStore(directory);
      expect((await store.load()).raw).toBe(null);
      const first = initialGame();
      const second = transition(first, { type: 'accept', id: 'd1-canteen' });
      await Promise.all([
        store.save(JSON.stringify(first)),
        store.save(JSON.stringify(second)),
      ]);
      expect(parseGameSave((await store.load()).raw as string).revision).toBe(
        second.revision,
      );
      expect(parseGameSave(await store.backup()).revision).toBe(first.revision);
      await writeFile(store.location, '{broken', 'utf8');
      const result = await store.load();
      expect(result.warning).toBeTruthy();
      expect(result.backupAvailable).toBe(true);
      expect(result.corruptRaw).toBe('{broken');
      await store.save(await store.backup());
      expect(parseGameSave(await readFile(store.location, 'utf8'))).toEqual(
        first,
      );
      expect(parseGameSave(await store.backup())).toEqual(first);
      expect(() => store.save('{broken')).toThrow();
    } finally {
      if (path.resolve(directory).startsWith(path.resolve(prefix))) {
        await rm(directory, { recursive: true, force: true });
      }
    }
  });
});
