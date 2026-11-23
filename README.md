# EnvDoctor

> **Catch environment configuration errors before they break your application.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![CI](https://github.com/utkarsh-x-jain/env-doctor/workflows/CI/badge.svg)](https://github.com/utkarsh-x-jain/env-doctor/actions)

<!-- npm badges will be available after publishing:
[![npm version](https://img.shields.io/npm/v/@niolx/env-doctor.svg)](https://www.npmjs.com/package/@niolx/env-doctor)
[![npm downloads](https://img.shields.io/npm/dm/@niolx/env-doctor.svg)](https://www.npmjs.com/package/@niolx/env-doctor)
-->

---

## The Problem

Environment configuration errors are a leading cause of deployment failures and runtime bugs:

- **Missing variables** - Forgetting to set `DATABASE_URL` or `JWT_SECRET` in production
- **Empty values** - Variables exist but are empty, causing silent failures
- **Extra variables** - Drift between `.env` and `.env.example` goes unnoticed
- **Typos** - `DATABSE_URL` instead of `DATABASE_URL` 
- **No validation** - No automated check before deployment

## The Solution

EnvDoctor validates your environment configuration **before** deployment:

```bash
$ env-doctor check
╔══════════════════════════════════════════════════════════════╗
║                    EnvDoctor Report                          ║
╚══════════════════════════════════════════════════════════════╝

  ✓ Configuration is healthy

  Environment file: .env
  Example file: .env.example

  Summary:
    Total variables: 12
    Missing: 0
    Empty: 0
    Extra: 0

$ echo $?
0
```

---

## Features

- 🔍 **Detects missing variables** - Compares `.env` against `.env.example`
- ⚠️ **Finds empty values** - Catches variables that exist but have no value
- 📋 **Identifies extra variables** - Flags variables not in the example file
- 🔐 **Never exposes secrets** - Values are masked in all output
- ⚡ **Zero runtime dependencies** - Lightweight, fast, no supply chain risk
- 📦 **CLI & Library** - Use as a command or import in your code
- 🎨 **Beautiful output** - Colored, formatted terminal reports
- 📊 **JSON support** - Machine-readable output for CI/CD
- 🔧 **Highly configurable** - Strict mode, custom paths, required/optional vars
- 🌍 **process.env fallback** - Optionally use system environment as backup
- 📝 **Full .env parsing** - Supports quotes, exports, comments, escapes

---

## Installation

```bash
# Global install (recommended for CLI usage)
npm install -g @niolx/env-doctor

# Or as a project dependency
npm install @niolx/env-doctor --save-dev
```

### Requirements

- Node.js 18.0.0 or higher

---

## Quick Start

1. **Create `.env.example`** with your required variables:
   ```bash
   # .env.example
   DATABASE_URL=
   JWT_SECRET=
   API_KEY=
   ```

2. **Create `.env`** with your actual values:
   ```bash
   # .env
   DATABASE_URL=postgresql://user:pass@localhost/db
   JWT_SECRET=super-secret-key
   API_KEY=abc123
   ```

3. **Run validation:**
   ```bash
   env-doctor check
   ```

---

## CLI Usage

### Commands

| Command | Description |
|---------|-------------|
| `env-doctor` | Run validation (default: `check`) |
| `env-doctor check` | Validate environment configuration |
| `env-doctor help` | Show help message |
| `env-doctor version` | Show version number |

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--env <path>` | `-e` | Path to `.env` file | `.env` |
| `--example <path>` | `-x` | Path to `.env.example` file | `.env.example` |
| `--cwd <path>` | | Working directory | Current directory |
| `--strict` | | Enable strict mode (warnings → errors) | `false` |
| `--json` | | Output as JSON | `false` |
| `--verbose` | | Show all variables in output | `false` |
| `--no-process-env` | | Disable `process.env` fallback | `false` |
| `--allow-extra <mode>` | | Handle extra vars: `warn`, `error`, `ignore` | `warn` |
| `--required <vars>` | | Comma-separated required variables | `[]` |
| `--optional <vars>` | | Comma-separated optional variables | `[]` |
| `--help` | `-h` | Show help | |
| `--version` | `-v` | Show version | |

### Examples

```bash
# Basic check
env-doctor check

# Strict mode - fail on any issue
env-doctor check --strict

# JSON output for CI/CD
env-doctor check --json

# Custom environment files
env-doctor check --env .env.production --example .env.example

# Different working directory
env-doctor check --cwd /path/to/project

# Treat extra variables as errors
env-doctor check --allow-extra error

# Require specific variables
env-doctor check --required DATABASE_URL,JWT_SECRET,API_KEY

# Disable process.env fallback
env-doctor check --no-process-env

# Verbose output
env-doctor check --verbose
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Configuration is healthy |
| `1` | Validation failure (missing, empty, extra in error mode) |
| `2` | CLI usage or configuration error (missing files, invalid args) |

---

## Programmatic API

```javascript
import { validateEnv, checkEnv, parseEnv, formatResult } from '@niolx/env-doctor';

// Full validation with details
const result = await validateEnv({
  cwd: '/path/to/project',
  envPath: '.env',
  examplePath: '.env.example',
  strict: false,
  allowExtra: 'warn',
  useProcessEnv: true,
  required: ['DATABASE_URL', 'JWT_SECRET'],
  optional: ['REDIS_URL']
});

if (!result.healthy) {
  console.error('Validation failed:');
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

// Quick health check
const isHealthy = await checkEnv({ strict: true });

// Parse .env content directly
const env = parseEnv('FOO=bar\nBAZ="qux quux"');
// { FOO: 'bar', BAZ: 'qux quux' }

// Format for display
console.log(formatResult(result));
console.log(formatResult(result, { json: true }));
console.log(formatResult(result, { verbose: true }));
```

### Configuration Options

```typescript
interface ValidateOptions {
  cwd?: string;                    // Working directory (default: process.cwd())
  envPath?: string;                // Env file path (default: '.env')
  examplePath?: string;            // Example file path (default: '.env.example')
  strict?: boolean;                // Strict mode (default: false)
  allowExtra?: 'warn' | 'error' | 'ignore';  // Extra vars handling (default: 'warn')
  useProcessEnv?: boolean;         // Use process.env fallback (default: true)
  required?: string[];             // Additional required variables
  optional?: string[];             // Additional optional variables
}
```

### Return Value

```typescript
interface ValidationResult {
  healthy: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  missing: string[];
  empty: string[];
  extra: string[];
  invalid: string[];
  duplicates: string[];
  envFile: string | null;
  exampleFile: string | null;
  variables: {
    [key: string]: {
      value: string;       // Masked (e.g., "ab****cd")
      source: 'env' | 'process';
      exampleValue: string | undefined;
    };
  };
  summary: {
    total: number;
    missing: number;
    empty: number;
    extra: number;
    invalid: number;
    duplicates: number;
  };
}
```

---

## Supported .env Syntax

EnvDoctor parses standard `.env` files with full feature support:

```env
# Comments
KEY=value                    # Simple value
KEY="double quoted"          # Double quotes with escape support
KEY='single quoted'          # Single quotes (literal)
KEY=`backtick quoted`        # Backticks with escape support
export KEY=value             # Export prefix
KEY = value                  # Spaces around =
KEY=                         # Empty value
KEY=value # inline comment   # Inline comments
```

### Escape Sequences (in `"` and `` ` ``)

| Sequence | Result |
|----------|--------|
| `\n` | Newline |
| `\r` | Carriage return |
| `\t` | Tab |
| `\\` | Backslash |
| `\"` | Double quote |
| `\$` | Dollar sign |

---

## Example Output

### Healthy Configuration

```
╔══════════════════════════════════════════════════════════════╗
║                    EnvDoctor Report                          ║
╚══════════════════════════════════════════════════════════════╝

  ✓ Configuration is healthy

  Environment file: .env
  Example file: .env.example

  Summary:
    Total variables: 15
    Missing: 0
    Empty: 0
    Extra: 0
```

### With Issues

```
╔══════════════════════════════════════════════════════════════╗
║                    EnvDoctor Report                          ║
╚══════════════════════════════════════════════════════════════╝

  ✗ Configuration has issues

  Environment file: .env
  Example file: .env.example

  Summary:
    Total variables: 12
    Missing: 2
    Empty: 1
    Extra: 1

  ✗ Errors:
    → Missing required variable: DATABASE_URL
    → Missing required variable: JWT_SECRET
    → Empty variable: API_KEY

  ⚠ Warnings:
    → Extra variable not in example: DEBUG_MODE
```

### JSON Output

```json
{
  "healthy": false,
  "errors": [
    "Missing required variable: DATABASE_URL",
    "Missing required variable: JWT_SECRET",
    "Empty variable: API_KEY"
  ],
  "warnings": [
    "Extra variable not in example: DEBUG_MODE"
  ],
  "missing": ["DATABASE_URL", "JWT_SECRET"],
  "empty": ["API_KEY"],
  "extra": ["DEBUG_MODE"],
  "summary": {
    "total": 12,
    "missing": 2,
    "empty": 1,
    "extra": 1,
    "invalid": 0,
    "duplicates": 0
  }
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/validate-env.yml
name: Validate Environment

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx @niolx/env-doctor check --strict --allow-extra error
```

### GitLab CI

```yaml
# .gitlab-ci.yml
validate_env:
  stage: test
  image: node:20
  script:
    - npm ci
    - npx @niolx/env-doctor check --strict --allow-extra error
```

### Pre-commit Hook

```bash
# Install
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npx @niolx/env-doctor check"
```

---

## Security Considerations

- **Never prints actual secret values** - All values are masked in output (`ab****cd`)
- **No network requests** - Runs entirely locally
- **No filesystem access beyond config** - Only reads specified `.env` files
- **Zero runtime dependencies** - No supply chain attack surface
- **Safe for CI/CD** - Use `--json` for machine parsing without exposing secrets

### Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use `.env.example` with dummy values** - Document required variables
3. **Run in CI** - Catch issues before deployment
4. **Use strict mode in production** - `env-doctor check --strict --allow-extra error`

---

## Development

```bash
# Clone the repository
git clone https://github.com/utkarsh-x-jain/env-doctor.git
cd env-doctor

# Install dependencies (none for runtime!)
npm install

# Run tests
npm test

# Run linter
npm run lint

# Run all checks
npm run check

# Test CLI locally
node src/cli.js check
```

---

## Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run specific test file
node --test test/parser.test.js
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Roadmap

- [ ] Support for `.env.local`, `.env.production`, etc. precedence
- [ ] Schema validation (types, formats, enums)
- [ ] Watch mode for development
- [ ] IDE integrations (VS Code extension)
- [ ] GitHub Action for easy CI integration
- [ ] Docker image
- [ ] Support for YAML/JSON config files

---

## Related Tools

- [dotenv](https://github.com/motdotla/dotenv) - Load `.env` files into `process.env`
- [dotenv-safe](https://github.com/rolodato/dotenv-safe) - Ensure all `.env.example` vars are set
- [env-schema](https://github.com/fastify/env-schema) - Validate env with JSON Schema
- [envalid](https://github.com/af/envalid) - Environment validation with types

---

**Made with ❤️ for developers who hate deployment surprises.**