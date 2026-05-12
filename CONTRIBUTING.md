# Contributing

## Branch Conventions

- `main` - Production-ready code
- `develop` - Integration branch if the project uses one
- `feature/*` - New features
- `fix/*` - Bug fixes

## Local Workflow

1. Install dependencies with `npm install`.
2. Start the full stack with `npm run dev:all`.
3. Make changes in a focused branch.
4. Run the relevant checks before opening a PR.

## Required Checks

- `npm run lint`
- `npm run format:check`
- `npm run type-check`
- `npm run test:run`
- `npm run test:e2e:ci` when browser coverage is affected

## Commit Style

Use conventional commits:

- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`

## Pull Request Process

1. Open a branch from `main`.
2. Keep commits small and reviewable.
3. Update code, tests, and docs together when behavior changes.
4. Include repro steps for bug fixes.
5. Wait for CI to pass before merging.

## Documentation Rule

If you change a command, port, environment variable, or public behavior, update the matching file in `docs/` or `README.md` in the same change.
