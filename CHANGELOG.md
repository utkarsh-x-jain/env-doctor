# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of EnvDoctor
- Environment file parser with full `.env` syntax support:
  - KEY=value pairs
  - Single-quoted, double-quoted, and backtick-quoted values
  - Export prefix syntax
  - Empty values and blank lines
  - Full-line and inline comments
  - Spaces around assignments
  - CRLF and LF line endings
  - Escaped characters in double quotes and backticks
  - Duplicate key handling (last wins)
- Environment validator:
  - Missing variable detection
  - Empty variable detection
  - Extra variable detection
  - Invalid variable name detection
  - Duplicate definition warnings
  - process.env fallback support
  - Required/optional variable configuration
  - Strict mode
  - Configurable extra variable handling (warn/error/ignore)
- CLI interface:
  - `check` command with multiple options
  - JSON output support
  - Verbose mode
  - Colored terminal output (with NO_COLOR support)
  - Proper exit codes (0/1/2)
- Programmatic API:
  - `validateEnv()` - Full validation with details
  - `checkEnv()` - Quick health check
  - `parseEnv()` - Parse .env content string
  - `parseEnvFile()` - Parse .env file from filesystem
  - `stringifyEnv()` - Convert object to .env format
  - `formatResult()` - Format validation result for display
  - `getExitCode()` - Get appropriate exit code
- Security features:
  - Secret masking in all output
  - No network requests
  - Zero runtime dependencies
- Comprehensive test suite
- Full documentation (README, API docs, CONTRIBUTING)

### Security
- No secrets ever printed in output, errors, or logs
- Values masked as `ab****cd` format
- No filesystem access beyond specified config files
- Zero runtime dependencies eliminates supply chain risk

## [Unreleased]

### Planned
- Support for `.env.local`, `.env.production` precedence
- Schema validation (types, formats, enums)
- Watch mode for development
- IDE integrations
- GitHub Action for CI
- Docker image