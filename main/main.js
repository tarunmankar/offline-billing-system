// Dynamic programmatic ts-node registration, with robust deprecation bypassing for TypeScript 6.0+
require('ts-node').register({
  transpileOnly: true,
  skipProject: true, // Completely isolates Electron Main from React tsconfig.json rules
  ignoreDiagnostics: [5107, 5101, 5011], // Force-ignores TS deprecation diagnostic errors
  compilerOptions: {
    module: 'CommonJS',
    target: 'ES2022',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true,
    ignoreDeprecations: '6.0' // Satisfies TS 6.0+ strict compiler rules
  }
});

// Load the main Electron application entrypoint
require('./index.ts');
