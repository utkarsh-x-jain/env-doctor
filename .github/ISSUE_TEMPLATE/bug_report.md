---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Run command '...'
3. See error '...'

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened. Include error messages, output, etc.

## Environment

- **Node.js version**: (run `node --version`)
- **npm version**: (run `npm --version`)
- **OS**: (e.g., macOS 14.0, Ubuntu 22.04, Windows 11)
- **EnvDoctor version**: (run `env-doctor --version` or `npm list env-doctor`)

## Configuration

### `.env.example` (relevant parts)
```env
# Paste relevant parts of your .env.example
```

### `.env` (relevant parts, **mask secrets!**)
```env
# Paste relevant parts, replace secrets with ***
DATABASE_URL=postgresql://***:***@localhost/db
JWT_SECRET=***
```

### Command Used
```bash
env-doctor check --strict --allow-extra error
```

## Additional Context

Add any other context about the problem here:
- Screenshots (if applicable)
- Related issues
- Workarounds you've tried

## Checklist

- [ ] I have searched existing issues for duplicates
- [ ] I have provided all requested information
- [ ] I have masked any secrets in the provided configuration
- [ ] I can reproduce this with the latest version