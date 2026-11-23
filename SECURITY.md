# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |

## Reporting a Vulnerability

If you discover a security vulnerability in EnvDoctor, please report it responsibly:

1. **Do not create a public issue** - This could expose the vulnerability
2. **Email the maintainer** at: security@utkarshjain.com (or use GitHub Security Advisories)
3. **Include details**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Features

EnvDoctor is designed with security as a core principle:

### Secret Protection

- **Never prints actual secret values** in any output, error messages, or logs
- All values are masked using format: `ab****cd` (first 2, last 2 characters)
- Empty values shown as `<empty>`
- Undefined values shown as `<undefined>`

### Zero Runtime Dependencies

- No `package.json` dependencies in production
- Eliminates supply chain attack surface
- No transitive dependency vulnerabilities
- Minimal attack surface

### Local-Only Operation

- No network requests of any kind
- No telemetry or data collection
- Only reads explicitly specified configuration files
- No filesystem access beyond `.env` and `.env.example`

### Safe for CI/CD

- JSON output for machine parsing without exposing secrets
- Exit codes for automation (0=healthy, 1=validation failure, 2=config error)
- `--no-process-env` flag to prevent accidental environment leakage

## Best Practices for Users

### 1. Never Commit `.env` Files

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### 2. Use `.env.example` with Dummy Values

```env
# .env.example
DATABASE_URL=postgresql://user:pass@localhost/db
JWT_SECRET=your-secret-key-change-in-production
API_KEY=your-api-key-here
```

### 3. Run Validation in CI

```yaml
# GitHub Actions
- name: Validate environment
  run: npx env-doctor check --strict --allow-extra error
```

### 4. Use Strict Mode in Production

```bash
env-doctor check --strict --allow-extra error
```

### 5. Disable process.env in CI

```bash
env-doctor check --no-process-env
```

## Threat Model

### Out of Scope

- Malicious `.env` files (user controls input)
- Compromised runtime environment
- Supply chain attacks on Node.js itself
- Physical access to deployment systems

### In Scope

- Secret leakage through output/logs
- Incorrect validation logic
- Parser vulnerabilities (ReDoS, etc.)
- CLI argument injection
- Configuration bypass

## Security Testing

Run security-related tests:

```bash
# Run all tests
npm test

# Check for secrets in codebase
grep -r "password\|secret\|key\|token" --include="*.js" src/ test/ | grep -v "example\|dummy\|test\|mask"

# Audit dependencies (should be zero)
npm audit
```

## Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledgment and initial assessment
3. **Day 3-7**: Fix development and testing
4. **Day 7-14**: Release patch version
5. **Day 14+**: Public disclosure (if applicable)

## Contact

For security concerns, contact:
- GitHub Security Advisories (preferred)
- Email: security@utkarshjain.com

Thank you for helping keep EnvDoctor secure! 🔒