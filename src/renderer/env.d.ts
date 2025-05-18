/// <reference types="@rsbuild/core/types" />

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer;
}
