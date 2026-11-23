/**
 * EnvDoctor - Catch environment configuration errors before they break your application.
 *
 * @module env-doctor
 */

import * as parser from './parser.js';
import * as validator from './validator.js';
import * as reporter from './reporter.js';
import * as utils from './utils.js';

// Named exports
export const { parseEnv, parseEnvFile, stringifyEnv } = parser;
export const { validateEnv, checkEnv } = validator;
export const { formatResult, formatSimple, getExitCode } = reporter;
export const { getDirname, resolveFromModule, findProjectRoot, deepMerge, sleep, formatBytes, truncate, isPlainObject, getVersion } = utils;

/**
 * Default export with all functions.
 * @type {Object}
 */
const envDoctor = {
  ...parser,
  ...validator,
  ...reporter,
  ...utils,
};

export default envDoctor;