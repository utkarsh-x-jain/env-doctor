/**
 * Example usage of env-doctor as a library.
 */

import { validateEnv, checkEnv, parseEnv, parseEnvFile, formatResult } from '../src/index.js';

// Example 1: Basic validation
async function basicValidation() {
  console.log('=== Basic Validation ===');
  const result = await validateEnv({
    cwd: './examples',
    envPath: '.env.example',  // Using example as env for demo
    examplePath: '.env.example'
  });
  console.log(formatResult(result));
}

// Example 2: Custom file paths
async function customPaths() {
  console.log('\n=== Custom Paths ===');
  const result = await validateEnv({
    cwd: './examples',
    envPath: '.env.example',
    examplePath: '.env.example'
  });
  console.log(`Healthy: ${result.healthy}`);
  console.log(`Missing: ${result.missing.join(', ') || 'none'}`);
  console.log(`Extra: ${result.extra.join(', ') || 'none'}`);
}

// Example 3: Strict mode
async function strictMode() {
  console.log('\n=== Strict Mode ===');
  // Create a temp env with empty value
  const result = await validateEnv({
    cwd: './examples',
    envPath: '.env.example',
    examplePath: '.env.example',
    strict: true
  });
  console.log(formatResult(result, { verbose: true }));
}

// Example 4: Programmatic validation with custom options
async function programmaticValidation() {
  console.log('\n=== Programmatic Validation ===');
  const isHealthy = await checkEnv({
    cwd: './examples',
    envPath: '.env.example',
    examplePath: '.env.example',
    required: ['NODE_ENV', 'PORT', 'DATABASE_URL'],
    optional: ['REDIS_URL'],
    allowExtra: 'warn',
    useProcessEnv: false
  });
  console.log(`Configuration healthy: ${isHealthy}`);
}

// Example 5: JSON report
async function jsonReport() {
  console.log('\n=== JSON Report ===');
  const result = await validateEnv({
    cwd: './examples',
    envPath: '.env.example',
    examplePath: '.env.example'
  });
  console.log(JSON.stringify(result, null, 2));
}

// Example 6: Parse env file directly
async function parseEnvExample() {
  console.log('\n=== Parse Env File ===');
  const content = `
# Database
DATABASE_URL=postgresql://user:pass@localhost/db
DATABASE_POOL_SIZE=10

# API
API_KEY="secret-key-with-spaces"
  `;
  const parsed = parseEnv(content);
  console.log('Parsed:', parsed);
}

// Example 7: Validation with process.env fallback
async function withProcessEnv() {
  console.log('\n=== With Process Env Fallback ===');
  // Set a process env var
  process.env.DEMO_VAR = 'from-process-env';
  
  const result = await validateEnv({
    cwd: './examples',
    envPath: '.env.example',
    examplePath: '.env.example',
    useProcessEnv: true
  });
  
  console.log('DEMO_VAR in result:', result.variables.DEMO_VAR);
  delete process.env.DEMO_VAR;
}

// Run all examples
async function runExamples() {
  try {
    await basicValidation();
    await customPaths();
    await strictMode();
    await programmaticValidation();
    await jsonReport();
    await parseEnvExample();
    await withProcessEnv();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runExamples();