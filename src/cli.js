#!/usr/bin/env node
/**
 * EnvDoctor CLI - Command line interface for environment validation.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { validateEnv, checkEnv } from './validator.js';
import { formatResult, formatSimple, getExitCode } from './reporter.js';
import { getVersion } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Print usage information.
 */
function printUsage() {
  console.log(`
Usage: env-doctor [command] [options]

Commands:
  check         Validate environment configuration (default)
  help          Show this help message
  version       Show version number

Options:
  --env <path>          Path to .env file (default: .env)
  --example <path>      Path to .env.example file (default: .env.example)
  --cwd <path>          Working directory (default: current directory)
  --strict              Enable strict mode (warnings become errors)
  --json                Output results as JSON
  --verbose             Show all variables in output
  --no-process-env      Disable process.env fallback
  --allow-extra <mode>  Handle extra variables: warn|error|ignore (default: warn)
  --required <vars>     Comma-separated list of required variables
  --optional <vars>     Comma-separated list of optional variables
  -h, --help            Show help
  -v, --version         Show version

Examples:
  env-doctor
  env-doctor check
  env-doctor check --strict
  env-doctor check --json
  env-doctor check --env .env.production --example .env.example
  env-doctor check --cwd /path/to/project
  env-doctor --version
`);
}

/**
 * Print version information.
 */
async function printVersion() {
  const version = await getVersion(import.meta.url);
  console.log(`env-doctor v${version}`);
}

/**
 * Parse command line arguments.
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const options = {
    command: 'check',
    envPath: '.env',
    examplePath: '.env.example',
    cwd: process.cwd(),
    strict: false,
    json: false,
    verbose: false,
    useProcessEnv: true,
    allowExtra: 'warn',
    required: [],
    optional: [],
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === 'check' || arg === 'help' || arg === 'version') {
      options.command = arg;
    } else if (arg === '--env' || arg === '-e') {
      options.envPath = args[++i];
    } else if (arg === '--example' || arg === '-x') {
      options.examplePath = args[++i];
    } else if (arg === '--cwd') {
      options.cwd = args[++i];
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--no-process-env') {
      options.useProcessEnv = false;
    } else if (arg === '--allow-extra') {
      const value = args[++i];
      if (['warn', 'error', 'ignore'].includes(value)) {
        options.allowExtra = value;
      } else {
        throw new Error(`Invalid --allow-extra value: ${value}. Use warn, error, or ignore.`);
      }
    } else if (arg === '--required') {
      options.required = args[++i].split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '--optional') {
      options.optional = args[++i].split(',').map(s => s.trim()).filter(Boolean);
    } else if (arg === '-h' || arg === '--help') {
      options.command = 'help';
    } else if (arg === '-v' || arg === '--version') {
      options.command = 'version';
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      // Unknown command
      throw new Error(`Unknown command: ${arg}`);
    }

    i++;
  }

  return options;
}

/**
 * Main CLI entry point.
 * @param {string[]} argv - Command line arguments
 * @returns {Promise<number>} Exit code
 */
export async function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);

    if (options.command === 'help') {
      printUsage();
      return 0;
    }

    if (options.command === 'version') {
      await printVersion();
      return 0;
    }

    if (options.command === 'check') {
      const result = await validateEnv({
        envPath: options.envPath,
        examplePath: options.examplePath,
        cwd: options.cwd,
        strict: options.strict,
        allowExtra: options.allowExtra,
        useProcessEnv: options.useProcessEnv,
        required: options.required,
        optional: options.optional,
      });

      // Output results
      if (options.json) {
        console.log(formatResult(result, { json: true }));
      } else if (options.verbose) {
        console.log(formatResult(result, { verbose: true }));
      } else {
        console.log(formatResult(result));
      }

      return getExitCode(result);
    }

    // Unknown command
    console.error(`Unknown command: ${options.command}`);
    printUsage();
    return 2;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 2;
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(code => process.exit(code)).catch(err => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(2);
  });
}