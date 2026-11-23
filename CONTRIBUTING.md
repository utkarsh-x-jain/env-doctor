# Contributing to EnvDoctor

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- No harassment, discrimination, or offensive behavior

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/utkarsh-x-jain/env-doctor/issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, package version)
   - Relevant code snippets or configuration

### Suggesting Features

1. Check existing issues and discussions
2. Create a feature request issue with:
   - Clear description of the feature
   - Use case and motivation
   - Possible implementation approach
   - Any breaking changes

### Pull Requests

1. **Fork** the repository
2. **Create a branch** for your change:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes** following the coding standards
4. **Add tests** for new functionality
5. **Run the test suite**:
   ```bash
   npm run check
   ```
6. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add support for .env.local precedence"
   # or
   git commit -m "fix: handle escaped quotes in single-quoted values"
   ```
7. **Push** to your fork and create a Pull Request

## Coding Standards

### Code Style

- Use ES modules (`import`/`export`)
- Target Node.js 18+
- No runtime dependencies
- Keep functions small and focused
- Use descriptive variable names
- Add JSDoc comments for public APIs

### Testing

- Write tests for all new features
- Cover edge cases in parser and validator
- Use Node.js built-in test runner
- Run `npm test` before submitting

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `chore`: Maintenance tasks

Examples:
```
feat(parser): add support for multiline quoted values
fix(validator): handle duplicate keys in .env.example
docs(readme): add CI/CD integration examples
test(cli): add test for --allow-extra flag
```

## Project Structure

```
env-doctor/
├── src/
│   ├── index.js       # Main exports
│   ├── parser.js      # .env file parser
│   ├── validator.js   # Validation logic
│   ├── reporter.js    # Output formatting
│   ├── cli.js         # CLI entry point
│   └── utils.js       # Utility functions
├── test/
│   ├── parser.test.js
│   ├── validator.test.js
│   ├── reporter.test.js
│   └── cli.test.js
├── examples/
│   ├── .env.example
│   └── usage.js
├── docs/
│   └── API.md
└── .github/
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/env-doctor.git
cd env-doctor

# No dependencies to install!
# (Zero runtime dependencies is a core feature)

# Run tests
npm test

# Run linter (syntax check)
npm run lint

# Run all checks
npm run check

# Test CLI manually
node src/cli.js check --help
```

## Testing Guidelines

- Place tests in `test/` directory with `.test.js` suffix
- Use descriptive test names
- Test both success and failure cases
- Mock filesystem operations where needed
- Test security: ensure secrets are never printed

## Documentation

- Update README.md for user-facing changes
- Update docs/API.md for API changes
- Add JSDoc comments for new functions
- Include examples for new features

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Publish to npm (maintainers only)

## Questions?

- Open a [Discussion](https://github.com/utkarsh-x-jain/env-doctor/discussions)
- Check existing [Issues](https://github.com/utkarsh-x-jain/env-doctor/issues)

Thank you for contributing! 🎉