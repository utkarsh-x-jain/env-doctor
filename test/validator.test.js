/**
 * Tests for the validator module.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { validateEnv, checkEnv } from '../src/validator.js';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('validator', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'env-doctor-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  async function createFiles(envContent, exampleContent) {
    if (envContent !== null) {
      await writeFile(join(tempDir, '.env'), envContent);
    }
    if (exampleContent !== null) {
      await writeFile(join(tempDir, '.env.example'), exampleContent);
    }
  }

  describe('validateEnv', () => {
    it('should return healthy when .env matches .env.example', async () => {
      await createFiles('FOO=bar\nBAZ=qux', 'FOO=\nBAZ=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, true);
      assert.strictEqual(result.missing.length, 0);
      assert.strictEqual(result.empty.length, 0);
    });

    it('should detect missing variables', async () => {
      await createFiles('FOO=bar', 'FOO=\nBAZ=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, false);
      assert.deepStrictEqual(result.missing, ['BAZ']);
      assert.ok(result.errors.some(e => e.includes('Missing required variable: BAZ')));
    });

    it('should detect empty variables', async () => {
      await createFiles('FOO=\nBAZ=qux', 'FOO=\nBAZ=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, true); // Not strict by default
      assert.deepStrictEqual(result.empty, ['FOO']);
      assert.ok(result.warnings.some(w => w.includes('Empty variable: FOO')));
    });

    it('should treat empty variables as errors in strict mode', async () => {
      await createFiles('FOO=\nBAZ=qux', 'FOO=\nBAZ=');
      const result = await validateEnv({ cwd: tempDir, strict: true });
      assert.strictEqual(result.healthy, false);
      assert.deepStrictEqual(result.empty, ['FOO']);
      assert.ok(result.errors.some(e => e.includes('Empty variable: FOO')));
    });

    it('should detect extra variables', async () => {
      await createFiles('FOO=bar\nEXTRA=value', 'FOO=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, true);
      assert.deepStrictEqual(result.extra, ['EXTRA']);
      assert.ok(result.warnings.some(w => w.includes('Extra variable not in example: EXTRA')));
    });

    it('should treat extra variables as errors when configured', async () => {
      await createFiles('FOO=bar\nEXTRA=value', 'FOO=');
      const result = await validateEnv({ cwd: tempDir, allowExtra: 'error' });
      assert.strictEqual(result.healthy, false);
      assert.ok(result.errors.some(e => e.includes('Extra variable not in example: EXTRA')));
    });

    it('should ignore extra variables when configured', async () => {
      await createFiles('FOO=bar\nEXTRA=value', 'FOO=');
      const result = await validateEnv({ cwd: tempDir, allowExtra: 'ignore' });
      assert.strictEqual(result.healthy, true);
      assert.strictEqual(result.warnings.length, 0);
    });

    it('should use process.env as fallback', async () => {
      process.env.TEST_FALLBACK_VAR = 'from-process';
      await createFiles('', 'TEST_FALLBACK_VAR=');
      const result = await validateEnv({ cwd: tempDir, useProcessEnv: true });
      assert.strictEqual(result.healthy, true);
      assert.strictEqual(result.variables.TEST_FALLBACK_VAR.source, 'process');
      delete process.env.TEST_FALLBACK_VAR;
    });

    it('should not use process.env when disabled', async () => {
      process.env.TEST_FALLBACK_VAR = 'from-process';
      await createFiles('', 'TEST_FALLBACK_VAR=');
      const result = await validateEnv({ cwd: tempDir, useProcessEnv: false });
      assert.strictEqual(result.healthy, false);
      assert.deepStrictEqual(result.missing, ['TEST_FALLBACK_VAR']);
      delete process.env.TEST_FALLBACK_VAR;
    });

    it('should prioritize .env over process.env', async () => {
      process.env.TEST_PRIORITY_VAR = 'from-process';
      await createFiles('TEST_PRIORITY_VAR=from-env', 'TEST_PRIORITY_VAR=');
      const result = await validateEnv({ cwd: tempDir, useProcessEnv: true });
      // Value is masked for security
      assert.strictEqual(result.variables.TEST_PRIORITY_VAR.value, 'fr****nv');
      assert.strictEqual(result.variables.TEST_PRIORITY_VAR.source, 'env');
      delete process.env.TEST_PRIORITY_VAR;
    });

    it('should detect invalid variable names', async () => {
      await createFiles('123INVALID=foo', '123INVALID=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, false);
      assert.deepStrictEqual(result.invalid, ['123INVALID']);
      assert.ok(result.errors.some(e => e.includes('Invalid variable name: 123INVALID')));
    });

    it('should handle missing .env file', async () => {
      await createFiles(null, 'FOO=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, false);
      assert.ok(result.errors.some(e => e.includes('Environment file not found')));
      assert.strictEqual(result.envFile, null);
    });

    it('should warn on missing .env.example file', async () => {
      await createFiles('FOO=bar', null);
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.healthy, true); // Only warning
      assert.ok(result.warnings.some(w => w.includes('Example file not found')));
      assert.strictEqual(result.exampleFile, null);
    });

    it('should respect required option', async () => {
      await createFiles('FOO=bar', 'FOO=');
      const result = await validateEnv({ cwd: tempDir, required: ['REQUIRED_VAR'] });
      assert.strictEqual(result.healthy, false);
      assert.deepStrictEqual(result.missing, ['REQUIRED_VAR']);
      assert.ok(result.errors.some(e => e.includes('Required variable missing: REQUIRED_VAR')));
    });

    it('should return variable metadata', async () => {
      await createFiles('FOO=bar\nBAZ=qux', 'FOO=\nBAZ=');
      const result = await validateEnv({ cwd: tempDir });
      assert.ok(result.variables.FOO);
      // 'bar' has length 3, so masked value is 'ba*' (first 2 + 1 star)
      assert.strictEqual(result.variables.FOO.value, 'ba*');
      assert.strictEqual(result.variables.FOO.source, 'env');
      assert.strictEqual(result.variables.FOO.exampleValue, '');
    });

    it('should handle custom file paths', async () => {
      await writeFile(join(tempDir, 'custom.env'), 'FOO=bar');
      await writeFile(join(tempDir, 'custom.example'), 'FOO=');
      const result = await validateEnv({
        cwd: tempDir,
        envPath: 'custom.env',
        examplePath: 'custom.example'
      });
      assert.strictEqual(result.healthy, true);
      assert.strictEqual(result.envFile, 'custom.env');
      assert.strictEqual(result.exampleFile, 'custom.example');
    });

    it('should provide summary', async () => {
      await createFiles('FOO=bar\nEMPTY=\nEXTRA=val', 'FOO=\nEMPTY=\nMISSING=');
      const result = await validateEnv({ cwd: tempDir });
      assert.strictEqual(result.summary.total, 3);
      assert.strictEqual(result.summary.missing, 1);
      assert.strictEqual(result.summary.empty, 1);
      assert.strictEqual(result.summary.extra, 1);
    });
  });

  describe('checkEnv', () => {
    it('should return true for healthy config', async () => {
      await createFiles('FOO=bar', 'FOO=');
      const result = await checkEnv({ cwd: tempDir });
      assert.strictEqual(result, true);
    });

    it('should return false for unhealthy config', async () => {
      await createFiles('FOO=bar', 'FOO=\nBAZ=');
      const result = await checkEnv({ cwd: tempDir });
      assert.strictEqual(result, false);
    });
  });
});