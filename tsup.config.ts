import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['chalk', 'commander', 'ora'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
