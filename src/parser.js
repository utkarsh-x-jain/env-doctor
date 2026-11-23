/**
 * Environment file parser for .env files.
 * Supports KEY=value, quoted values, export syntax, comments, and more.
 */

/**
 * Parse a .env file content into key-value pairs.
 * @param {string} content - The content of the .env file
 * @returns {Object} Object with parsed variables, invalid keys, and duplicates
 */
export function parseEnv(content) {
  const result = {};
  const invalidKeys = [];
  const duplicates = [];
  const seenKeys = new Set();
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Skip full-line comments
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) {
      continue;
    }

    // Handle export prefix (with or without space after export)
    if (trimmedLine.startsWith('export ')) {
      line = trimmedLine.slice(7);
    } else if (trimmedLine.startsWith('export')) {
      // Handle 'exportKEY=value' (no space)
      line = trimmedLine.slice(6);
    }

    // Find the first equals sign (not in quotes)
    const eqIndex = findFirstUnquotedEquals(line);
    if (eqIndex === -1) {
      // Invalid line, skip
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Validate key
    if (!isValidKey(key)) {
      invalidKeys.push(key);
      continue;
    }

    // Parse value (handle quotes, escaped chars, inline comments)
    value = parseValue(value);

    // Track duplicates
    if (seenKeys.has(key)) {
      duplicates.push(key);
    } else {
      seenKeys.add(key);
    }

    // Handle duplicate keys - last one wins (documented behavior)
    result[key] = value;
  }

  return { parsed: result, invalidKeys, duplicates };
}

/**
 * Find the first equals sign that is not inside quotes.
 * @param {string} line - The line to search
 * @returns {number} Index of equals sign or -1
 */
function findFirstUnquotedEquals(line) {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      continue;
    }

    if (char === '=' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      return i;
    }
  }

  return -1;
}

/**
 * Validate if a string is a valid environment variable key.
 * @param {string} key - The key to validate
 * @returns {boolean}
 */
function isValidKey(key) {
  // Must start with letter or underscore, followed by letters, digits, underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
}

/**
 * Parse a value string, handling quotes, escapes, and inline comments.
 * @param {string} value - The raw value string
 * @returns {string} Parsed value
 */
function parseValue(value) {
  // First, find the end of the value (before any inline comment)
  // We need to track quote state to avoid treating # inside quotes as comments
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escaped = false;
  let valueEnd = value.length;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      continue;
    }

    if (char === '#' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      // Found inline comment - value ends here
      valueEnd = i;
      break;
    }
  }

  // Slice to get the value part (before any inline comment)
  value = value.slice(0, valueEnd).trimEnd();

  // Now remove surrounding quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('`') && value.endsWith('`'))) {
    const quoteChar = value[0];
    value = value.slice(1, -1);

    // Handle escaped characters inside quotes
    if (quoteChar === '"' || quoteChar === '`') {
      value = value.replace(/\\(.)/g, (_, char) => {
        // Handle common escape sequences
        const escapes = {
          'n': '\n',
          'r': '\r',
          't': '\t',
          '\\': '\\',
          '"': '"',
          "'": "'",
          '`': '`',
          '$': '$'
        };
        return escapes[char] || char;
      });
    }
    // Single quotes - no escaping except for the quote itself
  }

  return value;
}

/**
 * Parse a .env file from the filesystem.
 * @param {string} filePath - Path to the .env file
 * @returns {Object} Parsed environment variables
 */
export async function parseEnvFile(filePath) {
  const fs = await import('fs/promises');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseEnv(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

/**
 * Stringify environment variables to .env format.
 * @param {Object} env - Environment variables object
 * @returns {string} Formatted .env content
 */
export function stringifyEnv(env) {
  const lines = [];
  for (const [key, value] of Object.entries(env)) {
    // Escape value for double quotes
    const escapedValue = String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    lines.push(`${key}="${escapedValue}"`);
  }
  return lines.join('\n');
}