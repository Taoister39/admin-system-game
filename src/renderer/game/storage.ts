import type { SaveLoad } from '@common/bridge';
import { parseGameSave } from '@common/game';

const SAVE_KEY = 'town-office.save.v1';
const BACKUP_KEY = 'town-office.backup.v1';
export const storage = {
  async load(): Promise<SaveLoad> {
    if (window.gameStorage) return window.gameStorage.load();
    let backupAvailable = false;
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        try {
          parseGameSave(backup);
          backupAvailable = true;
        } catch {}
      }
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw)
        return {
          raw: null,
          backupAvailable,
          ...(backupAvailable
            ? { warning: '主存档缺失，可恢复上次有效备份。' }
            : {}),
        };
      try {
        parseGameSave(raw);
        return { raw, backupAvailable };
      } catch {
        return {
          raw: null,
          backupAvailable,
          corruptRaw: raw,
          warning:
            '存档损坏或版本不受支持。原数据已保留，可恢复备份或导入存档。',
        };
      }
    } catch {
      return {
        raw: null,
        backupAvailable: false,
        warning: '无法使用本地存储，请允许浏览器保存数据或使用桌面版。',
      };
    }
  },
  async save(raw: string) {
    parseGameSave(raw);
    if (window.gameStorage) return window.gameStorage.save(raw);
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) {
      let valid = false;
      try {
        parseGameSave(previous);
        valid = true;
      } catch {}
      if (valid) localStorage.setItem(BACKUP_KEY, previous);
    }
    localStorage.setItem(SAVE_KEY, raw);
  },
  async backup() {
    if (window.gameStorage) return window.gameStorage.backup();
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) throw new Error('没有可恢复的备份。');
    parseGameSave(raw);
    return raw;
  },
  async location() {
    return window.gameStorage
      ? window.gameStorage.saveLocation()
      : '当前浏览器的本地存储（桌面版使用用户数据目录）';
  },
};
export function downloadSave(raw: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([raw], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
