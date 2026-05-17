// Dynamic programmatic ts-node registration to bypass Node ESM hooks conflicts in Electron main process
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    target: 'ES2022',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true
  }
});

// Load the main Electron application entrypoint
require('./index.ts');
