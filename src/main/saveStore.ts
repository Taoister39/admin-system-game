import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SaveLoad } from '@common/bridge';
import { parseGameSave } from '@common/game';

export function createSaveStore(directory: string) {
  const primary = path.join(directory, 'game-save.json');
  const backup = path.join(directory, 'game-save.backup.json');
  let queue = Promise.resolve();
  async function validBackup() {
    try {
      const raw = await readFile(backup, 'utf8');
      parseGameSave(raw);
      return raw;
    } catch {
      return null;
    }
  }
  return {
    location: primary,
    async load(): Promise<SaveLoad> {
      const backupAvailable = !!(await validBackup());
      let raw: string;
      try {
        raw = await readFile(primary, 'utf8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT')
          return {
            raw: null,
            backupAvailable,
            ...(backupAvailable
              ? { warning: '主存档缺失，但仍有有效备份。' }
              : {}),
          };
        return {
          raw: null,
          backupAvailable,
          warning: '无法读取存档，请检查目录权限。',
        };
      }
      try {
        parseGameSave(raw);
        return { raw, backupAvailable };
      } catch {
        return {
          raw: null,
          backupAvailable,
          corruptRaw: raw,
          warning:
            '当前存档损坏或版本不受支持。原文件仍被保留，请恢复备份或导入有效存档。',
        };
      }
    },
    save(raw: string) {
      parseGameSave(raw);
      const task = queue
        .catch(() => {})
        .then(async () => {
          await mkdir(directory, { recursive: true });
          let previous: string | null = null;
          try {
            previous = await readFile(primary, 'utf8');
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
          if (previous) {
            let valid = false;
            try {
              parseGameSave(previous);
              valid = true;
            } catch {}
            if (valid) {
              await writeFile(`${backup}.tmp`, previous, 'utf8');
              await rename(`${backup}.tmp`, backup);
            }
          }
          await writeFile(`${primary}.tmp`, raw, 'utf8');
          await rename(`${primary}.tmp`, primary);
        });
      queue = task;
      return task;
    },
    async backup() {
      const raw = await validBackup();
      if (!raw) throw new Error('没有可恢复的有效备份。');
      return raw;
    },
  };
}
