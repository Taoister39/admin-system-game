import type { GameBridge } from '@common/bridge';
import { contextBridge, ipcRenderer } from 'electron';

const bridge: GameBridge = {
  load: () => ipcRenderer.invoke('game:load'),
  save: (raw) => ipcRenderer.invoke('game:save', raw),
  backup: () => ipcRenderer.invoke('game:backup'),
  saveLocation: () => ipcRenderer.invoke('game:location'),
};
contextBridge.exposeInMainWorld('gameStorage', bridge);
