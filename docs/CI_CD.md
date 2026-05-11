# CI/CD Operations Guide

This guide maps the repository's GitHub Actions workflows to the production
deployment requirements for Voice-Agent-PuPuPlatter. It also lists the
repository settings, secrets, variables, and branch protection checks required
to operate the pipeline.

## Workflow Audit

| Workflow     | File                             | Trigger                                                      | Current Purpose                                        | Audit Notes                                                                                                                                   |
| ------------ | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Code Quality | `.github/workflows/quality.yml`  | `push` and `pull_request` to `main`                          | Lint, format, and TypeScript checks                    | Uses Node.js 22, npm caching, `npm run lint`, `npm run format:check`, and `npm run type-check`.                                               |
| Build & Test | `.github/workflows/test.yml`     | `push` and `pull_request` to `main`                          | Production build and Vitest run                        | Uses Node.js 22, npm caching, `npm run build`, `npm run test:run`, 7-day `dist/` retention, and failure diagnostics.                          |
| E2E Tests    | `.github/workflows/e2e.yml`      | `push` and `pull_request` to `main`                          | Bounded Playwright browser tests                       | Uses Node.js 22, npm caching, Playwright browser cache/deps, deterministic test env stubs, `npm run test:e2e:ci`, and 7-day report artifacts. |
| Security     | `.github/workflows/security.yml` | `push`, `pull_request`, scheduled scans, and manual dispatch | Gitleaks, CodeQL, dependency review, and npm audit     | Uses job-level least-privilege permissions. Gitleaks, CodeQL, dependency review, and high-severity npm audit findings are blocking checks.    |
| Deploy       | `.github/workflows/deploy.yml`   | `push` to `main` and manual dispatch                         | Build and push GHCR image, then deploy when configured | Publishes lowercase GHCR image tags, supports webhook, SSH, no-config skip, optional health check, and failure issue diagnostics.             |
| Release      | `.github/workflows/release.yml`  | `v*` tag push                                                | Build release artifact and create a GitHub release     | Builds with Node.js 22, creates release notes with a previous-tag fallback, uploads `voice-agent-dist.tar.gz`, and opens failure issues.      |
| Dependabot   | `.github/dependabot.yml`         | Weekly Dependabot scheduler                                  | npm and GitHub Actions update PRs                      | Covers npm and GitHub Actions with grouping, UTC cadence, PR limits, and triage labels.                                                       |

## Permission Audit

| Workflow     | Required Permissions                                                               | Reason                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Code Quality | `contents: read`                                                                   | Checkout only.                                                                                                        |
| Build & Test | `contents: read`                                                                   | Checkout only.                                                                                                        |
| E2E Tests    | `contents: read`                                                                   | Checkout only.                                                                                                        |
| Security     | `contents: read`, `security-events: write`, `actions: read`, `pull-requests: read` | CodeQL uploads SARIF, dependency review reads pull request dependency changes, and Gitleaks reads repository history. |
| Deploy       | `contents: read`, `packages: write`, `issues: write`                               | GHCR publication and failure issue diagnostics.                                                                       |
| Release      | `contents: write`, `issues: write`                                                 | GitHub release publication and failure issue diagnostics.                                                             |

## Runtime Configuration Audit

### Production Deployment Artifacts

| Artifact                                  | Purpose                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `docker-compose.deploy.yml`               | Remote image-based Compose file for SSH or Docker-host deployments                                  |
| `.env.production.example`                 | Production environment template for build-time public values, runtime secrets, and deploy variables |
| `scripts/deploy/verify-production.mjs`    | Post-deploy root page and `/api/health` verifier                                                    |
| `npm run deploy:verify -- --url <origin>` | Operator command for production verification                                                        |

### Required Secrets

| Secret                 | Workflow      | Required When                        | Purpose                                             |
| ---------------------- | ------------- | ------------------------------------ | --------------------------------------------------- |
| `GITHUB_TOKEN`         | All workflows | Always available from GitHub Actions | Checkout, CodeQL, GHCR login, releases, and issues. |
| `DEPLOY_WEBHOOK_TOKEN` | Deploy        | `DEPLOY_WEBHOOK_URL` is configured   | Bearer token for external deployment webhook.       |
| `DEPLOY_SSH_KEY`       | Deploy        | `DEPLOY_SSH_HOST` is configured      | Private key for SSH deployment fallback.            |

### Required Repository Variables

| Variable             | Workflow | Required When                | Purpose                                                                                  |
| -------------------- | -------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| `DEPLOY_WEBHOOK_URL` | Deploy   | Webhook deployment path      | HTTPS endpoint that receives image and commit payloads.                                  |
| `DEPLOY_SSH_HOST`    | Deploy   | SSH deployment path          | Hostname or IP for SSH deployment fallback.                                              |
| `DEPLOY_SSH_USER`    | Deploy   | SSH deployment path          | SSH user for deployment command execution.                                               |
| `DEPLOY_PATH`        | Deploy   | Optional with SSH deployment | Remote directory containing the production Compose file. Defaults to `/opt/voice-agent`. |
| `HEALTH_CHECK_URL`   | Deploy   | Optional after deployment    | Public health endpoint, usually `https://your-domain.com/api/health`.                    |

## Workflow Map

### Pull Requests To `main`

Pull requests run:

- Code Quality: `Lint`, `Format`, `Type Check`
- Build & Test: `Build`, `Unit Tests`
- E2E Tests: `E2E Tests`
- Security: `Secrets Scanning`, `CodeQL Analysis`, `Dependency Review`, `NPM Audit`

These checks use only repository read permissions and the default
`GITHUB_TOKEN`, except CodeQL, which also needs `security-events: write` to
upload SARIF results.

### Pushes To `main`

Pushes to `main` run all pull request checks except `Dependency Review`, which
is pull-request specific. They also run the deploy workflow:

1. Build and push the Docker image to GHCR.
2. Select a single deploy image reference.
3. Trigger deployment by webhook when `DEPLOY_WEBHOOK_URL` is configured.
4. Use SSH deployment when no webhook URL is configured and `DEPLOY_SSH_HOST`
   is configured.
5. Skip deployment with a notice when neither deploy path is configured.
6. Run a post-deploy health check when `HEALTH_CHECK_URL` is configured.

### Tags

Tag pushes matching `v*` run the release workflow:

1. Install dependencies with `npm ci`.
2. Build production assets with `npm run build`.
3. Generate release notes from the previous tag when available.
4. Package `dist/` and `RELEASE_NOTES.md` into `voice-agent-dist.tar.gz`.
5. Create a GitHub release with the packaged artifact.

### Scheduled Automation

- Security scans run on the 1st and 15th day of each month.
- Dependabot checks npm and GitHub Actions weekly on Monday in UTC.

## Local CI Parity Commands

Run these before opening a pull request when changing application code or CI:

```bash
npm ci
npm run lint
npm run format:check
npm run type-check
npm run test:run
npm run build
npm run test:e2e:ci
```

The full multi-browser Playwright suite remains available with
`npm run test:e2e`. It is intentionally not the default pull request gate
because it expands to more than 1000 tests in this repository and does not fit
the current E2E workflow timeout.

For Docker deployment parity:

```bash
npm run docker:prod
```

For production endpoint verification after a deployment:

```bash
npm run deploy:verify -- --url https://voice.example.com
```

For security parity:

```bash
npm audit --audit-level=high
```

## Known Gaps At Session Start

- `quality.yml` used a raw `npx tsc --noEmit` command instead of the project `type-check` script.
- `security.yml` used Node.js 20 for npm audit while the CI policy is Node.js 22.
- `deploy.yml` could not create failure issues with its declared permissions.
- `deploy.yml` passed the multi-line Docker metadata tag output directly to deployment payloads.
- `deploy.yml` did not include health-check failure context in failure issue creation.
- `release.yml` could not create failure issues with its declared permissions.
- `dependabot.yml` did not group GitHub Actions updates.

## PRD Coverage Matrix

| Requirement                                                                            | Workflow Or Setting                                                                                  | Status  | Notes                                                                                                                          |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Pull requests run lint, format, type-check, build, unit test, E2E, and security checks | `quality.yml`, `test.yml`, `e2e.yml`, `security.yml`                                                 | Covered | All are triggered for pull requests to `main`.                                                                                 |
| Main branch pushes build and publish production Docker images to GHCR                  | `deploy.yml`                                                                                         | Covered | The deploy workflow builds the validated Dockerfile and pushes to lowercase `ghcr.io/<owner>/<repo>`.                          |
| Deployment supports webhook path                                                       | `deploy.yml` plus `DEPLOY_WEBHOOK_URL` and `DEPLOY_WEBHOOK_TOKEN`                                    | Covered | Used when `DEPLOY_WEBHOOK_URL` is present.                                                                                     |
| Deployment supports SSH fallback path                                                  | `deploy.yml` plus `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`, and optional `DEPLOY_PATH` | Covered | Used when no webhook URL is configured and `DEPLOY_SSH_HOST` is present.                                                       |
| Deployment supports no-config fallback                                                 | `deploy.yml`                                                                                         | Covered | Image publication still succeeds and deployment step emits a notice when neither deployment path is configured.                |
| Post-deploy health checks are available                                                | `deploy.yml` plus `HEALTH_CHECK_URL`                                                                 | Covered | Health check runs only when a URL is configured.                                                                               |
| Tag pushes create release artifacts                                                    | `release.yml`                                                                                        | Covered | `v*` tags run build and release publication.                                                                                   |
| Dependabot covers npm and GitHub Actions updates                                       | `.github/dependabot.yml`                                                                             | Covered | Weekly npm and GitHub Actions updates are configured.                                                                          |
| Secrets remain runtime-only and are not Docker build args                              | `deploy.yml`, `Dockerfile`, `docker-compose.yml`, `docs/DEPLOYMENT.md`                               | Covered | Only public frontend build args and `NODE_ENV` are passed to Docker build. Provider keys remain runtime environment variables. |

## Branch Protection Recommendations

Enable a branch protection rule for `main` with these settings:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging when queueing is not enabled.
- Require conversation resolution before merging.
- Restrict force pushes and branch deletion.
- Require signed commits if the repository policy already mandates them.

Recommended required status checks:

| Workflow     | Required Checks                                                         |
| ------------ | ----------------------------------------------------------------------- |
| Code Quality | `Lint`, `Format`, `Type Check`                                          |
| Build & Test | `Build`, `Unit Tests`                                                   |
| E2E Tests    | `E2E Tests`                                                             |
| Security     | `Secrets Scanning`, `CodeQL Analysis`, `Dependency Review`, `NPM Audit` |

Do not require `Deploy` or `Release` checks for pull request branch protection.
Those workflows run from trusted `main` or tag events after code has merged.

## Environment Protection Recommendations

Create a `production` GitHub environment for the deploy workflow:

- Store deployment variables at repository or environment scope.
- Store deployment secrets at environment scope when possible.
- Limit deployment branches to `main`.
- Add required reviewers only if the team wants a manual gate; the Phase 01 MVP does not require approval gates.
- Keep `DEPLOY_WEBHOOK_TOKEN` and `DEPLOY_SSH_KEY` unavailable to pull request workflows.

## Deployment Configuration Examples

### Webhook Deployment

Configure:

- Repository or environment variable: `DEPLOY_WEBHOOK_URL`
- Environment secret: `DEPLOY_WEBHOOK_TOKEN`
- Optional repository or environment variable: `HEALTH_CHECK_URL`

The webhook receives JSON with `image`, `digest`, `sha`, and `run_url` fields.

### SSH Deployment

Configure:

- Repository or environment variable: `DEPLOY_SSH_HOST`
- Repository or environment variable: `DEPLOY_SSH_USER`
- Environment secret: `DEPLOY_SSH_KEY`
- Optional repository or environment variable: `DEPLOY_PATH`
- Optional repository or environment variable: `HEALTH_CHECK_URL`

The remote deployment path must contain a Compose file that can pull and start
the production image:

```text
/opt/voice-agent/
|-- docker-compose.deploy.yml
|-- .env.production
```

The workflow exports `IMAGE_REF` from the image built in the same workflow run,
then runs:

```bash
docker compose --env-file .env.production -f docker-compose.deploy.yml pull
docker compose --env-file .env.production -f docker-compose.deploy.yml up -d --remove-orphans
docker compose --env-file .env.production -f docker-compose.deploy.yml ps
```

Create `.env.production` from `.env.production.example` on the host. If GHCR is
private, log in to `ghcr.io` on the host before the first pull.

### No Deployment Configuration

If neither webhook nor SSH settings are configured, `deploy.yml` still builds
and pushes the GHCR image, then emits a notice with the image reference and
digest. This is expected during early deployment setup.

## GHCR Image Tags

The deploy workflow publishes the production image to:

```text
ghcr.io/<owner>/<repo>
```

Generated tags include:

- `sha-<commit>` for immutable commit references.
- `latest` on the default branch.
- The branch reference tag.
- Tag reference metadata when applicable.

The selected deploy image reference is the first generated Docker metadata tag.
