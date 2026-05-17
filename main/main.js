// Dynamic programmatic ts-node registration, skipping React's tsconfig.json to prevent compilation conflicts
require('ts-node').register({
  transpileOnly: true,
  skipProject: true, // Completely isolates Electron Main from React tsconfig.json rules
  compilerOptions: {
    module: 'CommonJS',
    target: 'ES2022',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true
  }
});

// Load the main Electron application entrypoint
require('./index.ts');
