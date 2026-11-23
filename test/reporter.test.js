/**
 * Tests for the reporter module.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatResult, formatSimple, getExitCode } from '../src/reporter.js';

describe('reporter', () => {
  const mockResult = {
    healthy: true,
    errors: [],
    warnings: ['Warning message'],
    info: ['Info message'],
    missing: [],
    empty: ['EMPTY_VAR'],
    extra: ['EXTRA_VAR'],
    invalid: [],
    duplicates: [],
    envFile: '.env',
    exampleFile: '.env.example',
    variables: {
      FOO: { value: 'ba****', source: 'env', exampleValue: '' },
      BAR: { value: 'qu****', source: 'process', exampleValue: '' },
    },
    summary: {
      total: 2,
      missing: 0,
      empty: 1,
      extra: 1,
      invalid: 0,
      duplicates: 0,
    },
  };

  const unhealthyResult = {
    ...mockResult,
    healthy: false,
    errors: ['Missing required variable: BAZ'],
    missing: ['BAZ'],
    summary: { ...mockResult.summary, missing: 1 },
  };

  describe('formatResult', () => {
    it('should format healthy result', () => {
      const output = formatResult(mockResult);
      assert.ok(output.includes('Configuration is healthy'));
      assert.ok(output.includes('.env'));
      assert.ok(output.includes('.env.example'));
    });

    it('should format unhealthy result', () => {
      const output = formatResult(unhealthyResult);
      assert.ok(output.includes('Configuration has issues'));
      assert.ok(output.includes('Missing required variable: BAZ'));
    });

    it('should output JSON when requested', () => {
      const output = formatResult(mockResult, { json: true });
      const parsed = JSON.parse(output);
      assert.strictEqual(parsed.healthy, true);
      assert.ok(parsed.variables.FOO);
      // Should not include masked values in JSON
      assert.strictEqual(parsed.variables.FOO.value, undefined);
    });

    it('should include verbose output when requested', () => {
      const output = formatResult(mockResult, { verbose: true });
      assert.ok(output.includes('Variables:'));
      assert.ok(output.includes('FOO'));
      assert.ok(output.includes('BAR'));
    });

    it('should show errors section', () => {
      const output = formatResult(unhealthyResult);
      assert.ok(output.includes('Errors:'));
      assert.ok(output.includes('Missing required variable: BAZ'));
    });

    it('should show warnings section', () => {
      const output = formatResult(mockResult);
      assert.ok(output.includes('Warnings:'));
      assert.ok(output.includes('Warning message'));
    });

    it('should show info section', () => {
      const output = formatResult(mockResult);
      assert.ok(output.includes('Info:'));
      assert.ok(output.includes('Info message'));
    });

    it('should show summary with counts', () => {
      const output = formatResult(mockResult);
      assert.ok(output.includes('Total variables:'));
      assert.ok(output.includes('Empty:'));
      assert.ok(output.includes('Extra:'));
    });
  });

  describe('formatSimple', () => {
    it('should return simple success message', () => {
      const output = formatSimple(mockResult);
      assert.ok(output.includes('All environment variables are valid'));
    });

    it('should return simple failure message', () => {
      const output = formatSimple(unhealthyResult);
      assert.ok(output.includes('Environment validation failed'));
    });
  });

  describe('getExitCode', () => {
    it('should return 0 for healthy result', () => {
      assert.strictEqual(getExitCode(mockResult), 0);
    });

    it('should return 1 for validation failure', () => {
      assert.strictEqual(getExitCode(unhealthyResult), 1);
    });

    it('should return 2 for config error', () => {
      const configError = {
        ...unhealthyResult,
        errors: ['Environment file not found: .env'],
      };
      assert.strictEqual(getExitCode(configError), 2);
    });
  });
});