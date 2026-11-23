/**
 * Environment validator - compares .env against .env.example and validates configuration.
 */

import { parseEnvFile } from './parser.js';

/**
 * Default configuration options.
 */
const DEFAULT_OPTIONS = {
  cwd: process.cwd(),
  envPath: '.env',
  examplePath: '.env.example',
  required: [],
  optional: [],
  strict: false,
  allowExtra: 'warn', // 'warn' | 'error' | 'ignore'
  useProcessEnv: true,
};

/**
 * Validate environment configuration.
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
export async function validateEnv(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Resolve paths relative to cwd
  const path = await import('path');
  const envPath = path.resolve(config.cwd, config.envPath);
  const examplePath = path.resolve(config.cwd, config.examplePath);

  // Parse .env file
  const envResult = await parseEnvFile(envPath);
  const envExists = envResult !== null;
  const envVars = envResult ? envResult.parsed : {};
  const envInvalidKeys = envResult ? envResult.invalidKeys : [];

  // Parse .env.example file
  const exampleResult = await parseEnvFile(examplePath);
  const exampleExists = exampleResult !== null;
  const exampleVars = exampleResult ? exampleResult.parsed : {};

  // Get variables from process.env if enabled
  const processEnvVars = config.useProcessEnv ? getProcessEnvVars() : {};

  // Merge: .env takes precedence, then process.env
  const actualVars = { ...processEnvVars, ...envVars };

  // Build validation result
  const result = {
    healthy: true,
    errors: [],
    warnings: [],
    info: [],
    missing: [],
    empty: [],
    extra: [],
    invalid: [],
    duplicates: [],
    envFile: envExists ? config.envPath : null,
    exampleFile: exampleExists ? config.examplePath : null,
    variables: {},
  };

  // Check if .env file exists
  if (!envExists) {
    result.errors.push(`Environment file not found: ${config.envPath}`);
    result.healthy = false;
  }

  // Check if .env.example file exists
  if (!exampleExists) {
    result.warnings.push(`Example file not found: ${config.examplePath}`);
    // Don't mark as unhealthy, just warn
  }

  // If no example file, we can only check for invalid names and duplicates
  if (!exampleExists) {
    return finalizeResult(result, actualVars, config);
  }

  // Get all keys from example file
  const exampleKeys = Object.keys(exampleVars || {});

  // Check for missing variables (in example but not in actual)
  for (const key of exampleKeys) {
    const inActual = key in actualVars;
    const inEnv = envVars && key in envVars;
    const inProcess = config.useProcessEnv && key in processEnvVars;

    if (!inActual) {
      result.missing.push(key);
      result.errors.push(`Missing required variable: ${key}`);
      result.healthy = false;
    } else {
      const value = actualVars[key];
      result.variables[key] = {
        value: maskValue(value),
        source: inEnv ? 'env' : (inProcess ? 'process' : 'unknown'),
        exampleValue: exampleVars[key],
      };

      // Check for empty values
      if (value === '' || value === undefined) {
        result.empty.push(key);
        if (config.strict) {
          result.errors.push(`Empty variable: ${key}`);
          result.healthy = false;
        } else {
          result.warnings.push(`Empty variable: ${key}`);
        }
      }
    }
  }

  // Check for extra variables (in .env but not in example)
  // Only check variables that are explicitly in the .env file, not process.env fallbacks
  const envKeys = envVars ? Object.keys(envVars) : [];
  for (const key of envKeys) {
    if (!exampleKeys.includes(key)) {
      result.extra.push(key);
      result.variables[key] = {
        value: maskValue(actualVars[key]),
        source: 'env',
        exampleValue: undefined,
      };

      if (config.allowExtra === 'error') {
        result.errors.push(`Extra variable not in example: ${key}`);
        result.healthy = false;
      } else if (config.allowExtra === 'warn') {
        result.warnings.push(`Extra variable not in example: ${key}`);
      }
      // 'ignore' - do nothing
    }
  }

  // Check for invalid variable names from parser
  for (const key of envInvalidKeys) {
    result.invalid.push(key);
    result.errors.push(`Invalid variable name: ${key}`);
    result.healthy = false;
  }

  // Check for invalid variable names in parsed env vars (shouldn't happen, but safety)
  for (const key of envKeys) {
    if (!isValidKey(key)) {
      result.invalid.push(key);
      result.errors.push(`Invalid variable name: ${key}`);
      result.healthy = false;
    }
  }

  // Check for duplicates in .env file
  if (envVars) {
    const duplicates = findDuplicates(envVars);
    if (duplicates.length > 0) {
      result.duplicates = duplicates;
      for (const key of duplicates) {
        result.warnings.push(`Duplicate definition in .env: ${key} (last value used)`);
      }
    }
  }

  // Check required variables from config
  for (const key of config.required) {
    if (!(key in actualVars)) {
      result.missing.push(key);
      result.errors.push(`Required variable missing: ${key}`);
      result.healthy = false;
    }
  }

  return finalizeResult(result, actualVars, config);
}

/**
 * Get environment variables from process.env, filtering out system ones.
 * @returns {Object} Process environment variables
 */
function getProcessEnvVars() {
  // Filter out common system/internal variables
  const systemPrefixes = [
    'NPM_',
    'NODE_',
    'V8_',
    'UV_',
    'GITHUB_',
    'CI_',
    'GIT_',
    'SHELL',
    'PATH',
    'HOME',
    'USER',
    'LANG',
    'LC_',
    'TERM',
    'PWD',
    'OLDPWD',
    'SHLVL',
    '_',
    'npm_',
  ];

  const result = {};
  for (const [key, value] of Object.entries(process.env)) {
    const isSystem = systemPrefixes.some(prefix =>
      key === prefix || key.startsWith(prefix)
    );
    if (!isSystem && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Validate if a string is a valid environment variable key.
 * @param {string} key - The key to validate
 * @returns {boolean}
 */
function isValidKey(key) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
}

/**
 * Find duplicate keys in parsed env (last one wins).
 * @param {Object} envVars - Parsed environment variables
 * @returns {string[]} Array of duplicate keys
 */
function findDuplicates(envVars) {
  // Since we use an object, duplicates are already resolved (last wins)
  // This would need the raw parsing to detect duplicates properly
  // For now, return empty - the parser handles this by last-wins
  return [];
}

/**
 * Mask sensitive values for output.
 * @param {string} value - The value to mask
 * @returns {string} Masked value
 */
function maskValue(value) {
  if (value === undefined || value === null) {
    return '<undefined>';
  }
  const str = String(value);
  if (str.length === 0) {
    return '<empty>';
  }
  if (str.length <= 2) {
    return '*'.repeat(str.length);
  }
  if (str.length <= 4) {
    return str.slice(0, 2) + '*'.repeat(str.length - 2);
  }
  return str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2);
}

/**
 * Finalize the validation result.
 * @param {Object} result - The result object
 * @param {Object} actualVars - Actual variables
 * @param {Object} config - Configuration
 * @returns {Object} Finalized result
 */
function finalizeResult(result, actualVars, config) {
  // Add summary
  result.summary = {
    total: Object.keys(result.variables).length,
    missing: result.missing.length,
    empty: result.empty.length,
    extra: result.extra.length,
    invalid: result.invalid.length,
    duplicates: result.duplicates.length,
  };

  // In strict mode, warnings become errors
  if (config.strict) {
    for (const warning of result.warnings) {
      if (!result.errors.includes(warning)) {
        result.errors.push(warning);
      }
    }
    result.warnings = [];
    if (result.errors.length > 0) {
      result.healthy = false;
    }
  }

  return result;
}

/**
 * Quick check function for simple use cases.
 * @param {Object} options - Validation options
 * @returns {Promise<boolean>} True if healthy
 */
export async function checkEnv(options = {}) {
  const result = await validateEnv(options);
  return result.healthy;
}