declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    readonly RSBUILD_DEV_SERVER_URL: string;
  }

  interface Process {
    electronApp: import('node:child_process').ChildProcess;
  }
}
