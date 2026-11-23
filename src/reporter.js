/**
 * Reporter - formats validation results for terminal output.
 */

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const SYMBOLS = {
  check: '✓',
  cross: '✗',
  warning: '⚠',
  info: 'ℹ',
  arrow: '→',
  bullet: '•',
};

/**
 * Check if color output is supported.
 * @returns {boolean}
 */
function supportsColor() {
  if (process.env.NO_COLOR) {
    return false;
  }
  if (process.env.FORCE_COLOR) {
    return true;
  }
  return process.stdout.isTTY;
}

/**
 * Apply color if supported.
 * @param {string} text - Text to colorize
 * @param {string} color - Color code
 * @returns {string}
 */
function colorize(text, color) {
  if (!supportsColor()) {
    return text;
  }
  return `${color}${text}${COLORS.reset}`;
}

/**
 * Format a validation result for terminal output.
 * @param {Object} result - Validation result from validateEnv
 * @param {Object} options - Formatting options
 * @returns {string} Formatted output
 */
export function formatResult(result, options = {}) {
  const { json = false, verbose = false } = options;

  if (json) {
    return JSON.stringify(stripInternal(result), null, 2);
  }

  const lines = [];

  // Header
  lines.push('');
  lines.push(colorize('╔══════════════════════════════════════════════════════════════╗', COLORS.cyan));
  lines.push(colorize('║                    EnvDoctor Report                          ║', COLORS.cyan));
  lines.push(colorize('╚══════════════════════════════════════════════════════════════╝', COLORS.cyan));
  lines.push('');

  // Status
  const statusText = result.healthy
    ? colorize(`${SYMBOLS.check} Configuration is healthy`, COLORS.green)
    : colorize(`${SYMBOLS.cross} Configuration has issues`, COLORS.red);
  lines.push(`  ${statusText}`);
  lines.push('');

  // File info
  if (result.envFile) {
    lines.push(`  ${colorize('Environment file:', COLORS.bold)} ${result.envFile}`);
  } else {
    lines.push(`  ${colorize('Environment file:', COLORS.bold)} ${colorize('NOT FOUND', COLORS.red)}`);
  }

  if (result.exampleFile) {
    lines.push(`  ${colorize('Example file:', COLORS.bold)} ${result.exampleFile}`);
  } else {
    lines.push(`  ${colorize('Example file:', COLORS.bold)} ${colorize('NOT FOUND', COLORS.yellow)}`);
  }
  lines.push('');

  // Summary
  const { summary } = result;
  lines.push(colorize('  Summary:', COLORS.bold));
  lines.push(`    ${colorize('Total variables:', COLORS.gray)} ${summary.total}`);
  if (summary.missing > 0) {
    lines.push(`    ${colorize(`${SYMBOLS.cross} Missing:`, COLORS.red)} ${summary.missing}`);
  }
  if (summary.empty > 0) {
    lines.push(`    ${colorize(`${SYMBOLS.warning} Empty:`, COLORS.yellow)} ${summary.empty}`);
  }
  if (summary.extra > 0) {
    lines.push(`    ${colorize(`${SYMBOLS.info} Extra:`, COLORS.blue)} ${summary.extra}`);
  }
  if (summary.invalid > 0) {
    lines.push(`    ${colorize(`${SYMBOLS.cross} Invalid:`, COLORS.red)} ${summary.invalid}`);
  }
  if (summary.duplicates > 0) {
    lines.push(`    ${colorize(`${SYMBOLS.warning} Duplicates:`, COLORS.yellow)} ${summary.duplicates}`);
  }
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push(colorize(`  ${SYMBOLS.cross} Errors:`, COLORS.red));
    for (const error of result.errors) {
      lines.push(`    ${colorize(SYMBOLS.arrow, COLORS.red)} ${error}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(colorize(`  ${SYMBOLS.warning} Warnings:`, COLORS.yellow));
    for (const warning of result.warnings) {
      lines.push(`    ${colorize(SYMBOLS.arrow, COLORS.yellow)} ${warning}`);
    }
    lines.push('');
  }

  // Info
  if (result.info.length > 0) {
    lines.push(colorize(`  ${SYMBOLS.info} Info:`, COLORS.blue));
    for (const info of result.info) {
      lines.push(`    ${colorize(SYMBOLS.arrow, COLORS.blue)} ${info}`);
    }
    lines.push('');
  }

  // Verbose: show all variables
  if (verbose && Object.keys(result.variables).length > 0) {
    lines.push(colorize('  Variables:', COLORS.bold));
    for (const [key, info] of Object.entries(result.variables)) {
      const sourceColor = info.source === 'env' ? COLORS.green : COLORS.blue;
      const sourceLabel = info.source === 'env' ? '.env' : 'process.env';
      lines.push(`    ${colorize(key, COLORS.bold)} = ${colorize(info.value, COLORS.gray)} ${colorize(`[${sourceLabel}]`, sourceColor)}`);
      if (info.exampleValue !== undefined) {
        lines.push(`      ${colorize('example:', COLORS.gray)} ${info.exampleValue}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Strip internal properties from result for JSON output.
 * @param {Object} result - Validation result
 * @returns {Object} Cleaned result
 */
function stripInternal(result) {
  const { variables, ...rest } = result;
  return {
    ...rest,
    variables: Object.fromEntries(
      Object.entries(variables).map(([key, info]) => [
        key,
        { source: info.source, exampleValue: info.exampleValue }
      ])
    ),
  };
}

/**
 * Format a simple pass/fail message.
 * @param {Object} result - Validation result
 * @returns {string}
 */
export function formatSimple(result) {
  if (result.healthy) {
    return colorize(`${SYMBOLS.check} All environment variables are valid`, COLORS.green);
  }
  return colorize(`${SYMBOLS.cross} Environment validation failed`, COLORS.red);
}

/**
 * Get the appropriate exit code for a result.
 * @param {Object} result - Validation result
 * @returns {number} Exit code (0 = healthy, 1 = validation failure, 2 = config error)
 */
export function getExitCode(result) {
  if (!result.healthy) {
    // Check if it's a config error (missing files, etc.)
    const hasConfigError = result.errors.some(e =>
      e.includes('not found') || e.includes('Invalid configuration')
    );
    return hasConfigError ? 2 : 1;
  }
  return 0;
}