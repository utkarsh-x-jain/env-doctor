/**
 * Tests for the CLI module.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

const CLI_PATH = join(process.cwd(), 'src/cli.js');

function runCLI(args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd,
      env: { ...process.env, NO_COLOR: '1' }, // Disable colors for testing
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => stdout += data.toString());
    child.stderr.on('data', data => stderr += data.toString());

    child.on('close', code => {
      resolve({ code, stdout, stderr });
    });
  });
}

describe('cli', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'env-doctor-cli-test-'));
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

  it('should show help with --help', async () => {
    const { code, stdout } = await runCLI(['--help']);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('Usage:'));
    assert.ok(stdout.includes('Commands:'));
    assert.ok(stdout.includes('check'));
    assert.ok(stdout.includes('Options:'));
  });

  it('should show help with help command', async () => {
    const { code, stdout } = await runCLI(['help']);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('Usage:'));
  });

  it('should show version with --version', async () => {
    const { code, stdout } = await runCLI(['--version']);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('env-doctor v'));
  });

  it('should show version with version command', async () => {
    const { code, stdout } = await runCLI(['version']);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('env-doctor v'));
  });

  it('should return exit code 0 for healthy config', async () => {
    await createFiles('FOO=bar\nBAZ=qux', 'FOO=\nBAZ=');
    const { code } = await runCLI(['check'], tempDir);
    assert.strictEqual(code, 0);
  });

  it('should return exit code 1 for missing variables', async () => {
    await createFiles('FOO=bar', 'FOO=\nBAZ=');
    const { code } = await runCLI(['check'], tempDir);
    assert.strictEqual(code, 1);
  });

  it('should return exit code 2 for missing .env file', async () => {
    await createFiles(null, 'FOO=');
    const { code } = await runCLI(['check'], tempDir);
    assert.strictEqual(code, 2);
  });

  it('should output JSON with --json', async () => {
    await createFiles('FOO=bar', 'FOO=');
    const { code, stdout } = await runCLI(['check', '--json'], tempDir);
    assert.strictEqual(code, 0);
    const parsed = JSON.parse(stdout.trim());
    assert.strictEqual(parsed.healthy, true);
  });

  it('should respect --strict flag', async () => {
    await createFiles('FOO=\nBAZ=qux', 'FOO=\nBAZ=');
    const { code } = await runCLI(['check', '--strict'], tempDir);
    assert.strictEqual(code, 1); // Empty becomes error in strict mode
  });

  it('should respect --env flag', async () => {
    await writeFile(join(tempDir, 'custom.env'), 'FOO=bar');
    await writeFile(join(tempDir, '.env.example'), 'FOO=');
    const { code } = await runCLI(['check', '--env', 'custom.env'], tempDir);
    assert.strictEqual(code, 0);
  });

  it('should respect --example flag', async () => {
    await writeFile(join(tempDir, '.env'), 'FOO=bar');
    await writeFile(join(tempDir, 'custom.example'), 'FOO=');
    const { code } = await runCLI(['check', '--example', 'custom.example'], tempDir);
    assert.strictEqual(code, 0);
  });

  it('should respect --cwd flag', async () => {
    await createFiles('FOO=bar', 'FOO=');
    const { code } = await runCLI(['check', '--cwd', tempDir]);
    assert.strictEqual(code, 0);
  });

  it('should respect --allow-extra=error', async () => {
    await createFiles('FOO=bar\nEXTRA=val', 'FOO=');
    const { code } = await runCLI(['check', '--allow-extra', 'error'], tempDir);
    assert.strictEqual(code, 1);
  });

  it('should respect --allow-extra=ignore', async () => {
    await createFiles('FOO=bar\nEXTRA=val', 'FOO=');
    const { code } = await runCLI(['check', '--allow-extra', 'ignore'], tempDir);
    assert.strictEqual(code, 0);
  });

  it('should respect --required flag', async () => {
    await createFiles('FOO=bar', 'FOO=');
    const { code } = await runCLI(['check', '--required', 'REQUIRED_VAR'], tempDir);
    assert.strictEqual(code, 1);
  });

  it('should respect --no-process-env flag', async () => {
    process.env.CLI_TEST_VAR = 'from-process';
    await createFiles('', 'CLI_TEST_VAR=');
    const { code } = await runCLI(['check', '--no-process-env'], tempDir);
    assert.strictEqual(code, 1);
    delete process.env.CLI_TEST_VAR;
  });

  it('should show verbose output with --verbose', async () => {
    await createFiles('FOO=bar', 'FOO=');
    const { code, stdout } = await runCLI(['check', '--verbose'], tempDir);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes('Variables:'));
  });

  it('should error on unknown option', async () => {
    const { code, stderr } = await runCLI(['--unknown-option']);
    assert.strictEqual(code, 2);
    assert.ok(stderr.includes('Unknown option'));
  });

  it('should error on unknown command', async () => {
    const { code, stderr } = await runCLI(['unknown-command']);
    assert.strictEqual(code, 2);
    assert.ok(stderr.includes('Unknown command'));
  });

  it('should error on invalid --allow-extra value', async () => {
    const { code, stderr } = await runCLI(['check', '--allow-extra', 'invalid']);
    assert.strictEqual(code, 2);
    assert.ok(stderr.includes('Invalid --allow-extra value'));
  });

  it('should not print secret values in output', async () => {
    await createFiles('API_SECRET=super-secret-key-123', 'API_SECRET=');
    const { code, stdout } = await runCLI(['check', '--verbose'], tempDir);
    assert.strictEqual(code, 0);
    // Should mask the secret
    assert.ok(stdout.includes('su****23') || stdout.includes('****'));
    assert.ok(!stdout.includes('super-secret-key-123'));
  });
});