/**
 * Utility functions for env-doctor.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

/**
 * Get the directory name of the current module.
 * @param {string} importMetaUrl - import.meta.url
 * @returns {string} Directory path
 */
export function getDirname(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}

/**
 * Resolve a path relative to the current module.
 * @param {string} importMetaUrl - import.meta.url
 * @param {string} relativePath - Relative path
 * @returns {string} Resolved absolute path
 */
export function resolveFromModule(importMetaUrl, relativePath) {
  return resolve(getDirname(importMetaUrl), relativePath);
}

/**
 * Find the project root by looking for package.json or .git.
 * @param {string} startDir - Starting directory
 * @returns {string|null} Project root or null
 */
export function findProjectRoot(startDir = process.cwd()) {
  const fs = require('fs');
  let currentDir = startDir;

  while (currentDir !== '/') {
    if (fs.existsSync(resolve(currentDir, 'package.json')) ||
        fs.existsSync(resolve(currentDir, '.git'))) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Deep merge objects.
 * @param {...Object} objects - Objects to merge
 * @returns {Object} Merged object
 */
export function deepMerge(...objects) {
  const result = {};
  for (const obj of objects) {
    if (!obj) continue;
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
        result[key] = deepMerge(result[key] || {}, value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Sleep for a specified duration.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable string.
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate a string to a maximum length.
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add when truncated
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength, suffix = '...') {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Check if a value is a plain object.
 * @param {*} value - Value to check
 * @returns {boolean}
 */
export function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Get the version from package.json.
 * @param {string} importMetaUrl - import.meta.url
 * @returns {string} Version string
 */
export async function getVersion(importMetaUrl) {
  const fs = await import('fs/promises');
  const path = await import('path');
  const packagePath = path.resolve(getDirname(importMetaUrl), '..', 'package.json');
  try {
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}