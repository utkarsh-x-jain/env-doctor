# EnvDoctor API Documentation

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Functions](#core-functions)
4. [Configuration Options](#configuration-options)
5. [Return Types](#return-types)
6. [Examples](#examples)

## Installation

```bash
npm install env-doctor
```

## Quick Start

```javascript
import { validateEnv, checkEnv } from 'env-doctor';

// Simple check
const isHealthy = await checkEnv();
if (!isHealthy) {
  console.error('Environment validation failed!');
  process.exit(1);
}

// Full validation with details
const result = await validateEnv();
console.log(result);
```

## Core Functions

### `validateEnv(options?)`

Performs full environment validation and returns a detailed result object.

**Parameters:**
- `options` (Object, optional) - Configuration options

**Returns:** `Promise<ValidationResult>`

```javascript
const result = await validateEnv({
  cwd: '/path/to/project',
  envPath: '.env',
  examplePath: '.env.example',
  strict: false,
  allowExtra: 'warn',
  useProcessEnv: true,
  required: ['API_KEY', 'DATABASE_URL'],
  optional: ['REDIS_URL']
});
```

### `checkEnv(options?)`

Quick health check - returns `true` if configuration is valid, `false` otherwise.

**Parameters:**
- `options` (Object, optional) - Same as `validateEnv`

**Returns:** `Promise<boolean>`

```javascript
const isHealthy = await checkEnv({ strict: true });
```

### `parseEnv(content)`

Parse a `.env` file content string into an object.

**Parameters:**
- `content` (string) - The content of the `.env` file

**Returns:** `Object` - Parsed key-value pairs

```javascript
const env = parseEnv('FOO=bar\nBAZ="qux quux"');
// { FOO: 'bar', BAZ: 'qux quux' }
```

### `parseEnvFile(filePath)`

Parse a `.env` file from the filesystem.

**Parameters:**
- `filePath` (string) - Path to the `.env` file

**Returns:** `Promise<Object|null>` - Parsed object or `null` if file doesn't exist

```javascript
const env = await parseEnvFile('./.env');
```

### `stringifyEnv(env)`

Convert an environment object to `.env` file format.

**Parameters:**
- `env` (Object) - Environment variables

**Returns:** `string` - Formatted `.env` content

```javascript
const content = stringifyEnv({ FOO: 'bar', BAZ: 'qux' });
// FOO="bar"\nBAZ="qux"
```

### `formatResult(result, options?)`

Format a validation result for terminal output.

**Parameters:**
- `result` (ValidationResult) - Result from `validateEnv`
- `options` (Object, optional) - Formatting options
  - `json` (boolean) - Output as JSON
  - `verbose` (boolean) - Show all variables

**Returns:** `string` - Formatted output

```javascript
console.log(formatResult(result));
console.log(formatResult(result, { json: true }));
console.log(formatResult(result, { verbose: true }));
```

### `getExitCode(result)`

Get the appropriate exit code for a validation result.

**Parameters:**
- `result` (ValidationResult) - Result from `validateEnv`

**Returns:** `number` - Exit code (0 = healthy, 1 = validation failure, 2 = config error)

```javascript
process.exit(getExitCode(result));
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cwd` | string | `process.cwd()` | Working directory for resolving paths |
| `envPath` | string | `'.env'` | Path to the environment file (relative to cwd) |
| `examplePath` | string | `'.env.example'` | Path to the example file (relative to cwd) |
| `strict` | boolean | `false` | Treat warnings as errors |
| `allowExtra` | string | `'warn'` | Handle extra variables: `'warn'`, `'error'`, or `'ignore'` |
| `useProcessEnv` | boolean | `true` | Fall back to `process.env` for missing variables |
| `required` | string[] | `[]` | Additional required variable names |
| `optional` | string[] | `[]` | Additional optional variable names |

## Return Types

### ValidationResult

```typescript
interface ValidationResult {
  healthy: boolean;           // Overall health status
  errors: string[];           // Error messages
  warnings: string[];         // Warning messages
  info: string[];             // Info messages
  missing: string[];          // Missing required variables
  empty: string[];            // Empty variables
  extra: string[];            // Extra variables not in example
  invalid: string[];          // Invalid variable names
  duplicates: string[];       // Duplicate definitions in .env
  envFile: string | null;     // Resolved env file path
  exampleFile: string | null; // Resolved example file path
  variables: VariableInfo;    // Variable metadata
  summary: Summary;           // Summary counts
}

interface VariableInfo {
  [key: string]: {
    value: string;       // Masked value for display
    source: 'env' | 'process';  // Where the value came from
    exampleValue: string | undefined;  // Value from .env.example
  };
}

interface Summary {
  total: number;
  missing: number;
  empty: number;
  extra: number;
  invalid: number;
  duplicates: number;
}
```

## Examples

### Basic Validation

```javascript
import { validateEnv } from 'env-doctor';

const result = await validateEnv();

if (!result.healthy) {
  console.error('Validation failed:');
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log('Environment is valid!');
```

### Custom Paths

```javascript
const result = await validateEnv({
  cwd: '/path/to/project',
  envPath: '.env.production',
  examplePath: '.env.example'
});
```

### Strict Mode

```javascript
const result = await validateEnv({
  strict: true,  // Empty variables become errors
  allowExtra: 'error'  // Extra variables become errors
});
```

### Required Variables

```javascript
const result = await validateEnv({
  required: ['DATABASE_URL', 'JWT_SECRET', 'API_KEY'],
  optional: ['REDIS_URL', 'SENTRY_DSN']
});
```

### Disable process.env Fallback

```javascript
const result = await validateEnv({
  useProcessEnv: false  // Only check .env file
});
```

### JSON Output

```javascript
const result = await validateEnv();
console.log(JSON.stringify(result, null, 2));
```

### Programmatic Check

```javascript
import { checkEnv } from 'env-doctor';

// In your application startup
const healthy = await checkEnv({
  required: ['DATABASE_URL', 'JWT_SECRET']
});

if (!healthy) {
  throw new Error('Invalid environment configuration');
}
```

### Parse and Validate Manually

```javascript
import { parseEnvFile, validateEnv } from 'env-doctor';

// Parse custom env file
const envVars = await parseEnvFile('./config/.env.production');

// Validate against example
const result = await validateEnv({
  envPath: 'config/.env.production',
  examplePath: '.env.example'
});
```

### Using in CI/CD

```javascript
// ci-check.js
import { validateEnv, getExitCode } from 'env-doctor';

const result = await validateEnv({
  strict: true,
  allowExtra: 'error',
  required: ['DATABASE_URL', 'JWT_SECRET', 'API_KEY']
});

console.log(formatResult(result));
process.exit(getExitCode(result));
```

Then in your CI:
```yaml
- name: Validate environment
  run: node ci-check.js
```