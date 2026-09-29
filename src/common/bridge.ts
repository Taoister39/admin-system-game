export interface SaveLoad {
  raw: string | null;
  warning?: string;
  backupAvailable: boolean;
  corruptRaw?: string;
}
export interface GameBridge {
  load: () => Promise<SaveLoad>;
  save: (raw: string) => Promise<void>;
  backup: () => Promise<string>;
  saveLocation: () => Promise<string>;
}
