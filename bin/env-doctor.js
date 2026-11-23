#!/usr/bin/env node
/**
 * EnvDoctor CLI - Entry point for npm bin wrapper.
 * This wrapper uses the package's exports to avoid relative import issues.
 */

import { main } from '../src/cli.js';

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(2);
});