# Session Specification

**Session ID**: `phase01-session02-github-actions-cicd-pipeline`
**Phase**: 01 - Production Deployment & DevOps
**Status**: Complete
**Created**: 2026-05-11

---

## 1. Session Overview

This session audits, reconciles, and completes the existing GitHub Actions CI/CD baseline for the Voice-Agent-PuPuPlatter production deployment phase. The repository already contains quality, test, E2E, security, deploy, release, and Dependabot workflow files, so this session is not a greenfield setup. The work is to verify the baseline against the PRD, close gaps, and make the workflows reliable enough to gate pull requests and support deployment from `main`.

The session follows Phase 01 Session 01 because the Docker production baseline is now validated. CI/CD is the next dependency in the phase: deployment configuration, monitoring, and production hardening all rely on predictable build, scan, image publication, and deployment workflows.

The outcome should be a consistent workflow set using the repository's npm scripts, Node.js version policy, Docker/GHCR deployment path, artifact retention, failure diagnostics, and documentation for required GitHub secrets, repository variables, and branch protection.

---

## 2. Objectives

1. Reconcile all existing GitHub Actions workflows against the Phase 01 CI/CD requirements.
2. Standardize Node.js, npm caching, permissions, artifacts, and diagnostics across workflows.
3. Complete the GHCR image publication, deployment trigger, health check, and release workflow documentation.
4. Document required GitHub secrets, repository variables, environment protection, and branch protection checks.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-docker-production-optimization` - Provides the validated Dockerfile, Docker Compose workflow, health check behavior, and GHCR-ready container baseline.

### Required Tools/Knowledge

- GitHub Actions workflow syntax and repository settings.
- Node.js 22, npm, Vite, Vitest, Playwright, and TypeScript project scripts.
- Docker Buildx and GitHub Container Registry publishing.
- Gitleaks, CodeQL, dependency review, npm audit, and Dependabot behavior.

### Environment Requirements

- GitHub repository with Actions enabled.
- GitHub Container Registry available for the repository.
- Repository settings access for branch protection and environment protection documentation.
- Optional deployment settings for webhook or SSH path validation.

---

## 4. Scope

### In Scope (MVP)

- Maintainers can run pull request workflows for lint, format, type-check, unit tests, E2E tests, build, and security scans - Reconcile `quality.yml`, `test.yml`, `e2e.yml`, and `security.yml` with local scripts and PRD success criteria.
- Maintainers can publish production Docker images to GitHub Container Registry - Reconcile `deploy.yml` build metadata, caching, tags, permissions, and artifact visibility.
- Operators can deploy from `main` through the selected Docker deployment path - Verify webhook, SSH, no-config fallback, health check, and failure diagnostic behavior.
- Maintainers can produce releases from tags - Reconcile `release.yml` with Node/version conventions, release artifacts, and failure reporting.
- Maintainers can understand required GitHub settings - Document secrets, variables, branch protection checks, environment protection, and Dependabot configuration.

### Out of Scope (Deferred)

- Additional release automation beyond the existing tag-based release workflow - Reason: Session stub explicitly defers extra release automation.
- Multiple environment deployments with separate staging and production promotion gates - Reason: Session stub keeps MVP to one main deployment path.
- Manual approval gates - Reason: Session stub defers manual gates.
- Cloud provider specific deployment setup - Reason: Phase 01 Session 03 owns deployment target configuration.

---

## 5. Technical Approach

### Architecture

Keep the existing split workflow architecture: separate files for code quality, build/test, E2E, security, deploy, and release. This preserves clear GitHub check names for branch protection and keeps each workflow focused. The implementation should reconcile each file rather than replacing the workflow layout unless the audit proves a consolidation is required.

The CI path should use `npm ci` with setup-node npm caching, call repository scripts from `package.json`, and retain diagnostics for failed builds and tests. The deployment path should build the validated Docker image, push to GHCR, trigger either webhook or SSH deployment when configured, skip deployment with a clear notice when not configured, and optionally run a post-deploy health check.

Documentation should describe how the workflows map to PR checks, what GitHub repository settings are required, and which secrets and variables enable deployment. Branch protection cannot be enforced from workflow YAML alone, so this session should document the exact required checks and environment settings.

### Design Patterns

- Audit-first reconciliation: Compare current files to PRD requirements before changing behavior.
- Small focused workflows: Preserve workflow files by concern for clear check names and maintenance.
- Least-privilege permissions: Grant write permissions only to workflows that need packages, releases, security events, or issues.
- Docs as operations contract: Document repo secrets, variables, and required checks close to deployment documentation.
- Fallback-compatible shell snippets: Avoid requiring `jq` without fallback behavior in workflow shell steps.

### Technology Stack

- GitHub Actions workflow YAML.
- Node.js 22 with npm caching and `npm ci`.
- Vite build, TypeScript, ESLint, Prettier, Vitest, and Playwright.
- Docker Buildx and GitHub Container Registry (`ghcr.io`).
- Gitleaks, CodeQL, dependency review, npm audit, and Dependabot.

---

## 6. Deliverables

### Files to Create

| File            | Purpose                                                                        | Est. Lines |
| --------------- | ------------------------------------------------------------------------------ | ---------- |
| `docs/CI_CD.md` | CI/CD workflow map, required checks, secrets, variables, and operational notes | ~160       |

### Files to Modify

| File                             | Changes                                                                             | Est. Lines |
| -------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| `.github/workflows/quality.yml`  | Standardize Node, scripts, cache, and type-check behavior                           | ~30        |
| `.github/workflows/test.yml`     | Reconcile build/unit tests, artifact retention, and diagnostics                     | ~40        |
| `.github/workflows/e2e.yml`      | Reconcile Playwright setup, env stubs, server readiness, and reports                | ~45        |
| `.github/workflows/security.yml` | Reconcile permissions, Node version, scan policy, and reporting                     | ~45        |
| `.github/workflows/deploy.yml`   | Reconcile GHCR build/push, deploy fallbacks, health checks, and failure diagnostics | ~70        |
| `.github/workflows/release.yml`  | Reconcile release build, notes, artifacts, permissions, and failure diagnostics     | ~35        |
| `.github/dependabot.yml`         | Verify npm and GitHub Actions update automation                                     | ~15        |
| `docs/DEPLOYMENT.md`             | Align deployment guide with workflow names, GHCR image tags, and secrets/vars       | ~60        |
| `README.md`                      | Add CI/CD entry points, badges or links, and deployment documentation pointers      | ~30        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Pull requests run quality, build, unit test, E2E, and security workflows.
- [ ] Main branch pushes build and push Docker images to GHCR.
- [ ] Deployment workflow supports webhook, SSH, and documented no-config fallback paths.
- [ ] Tag pushes create release artifacts through the release workflow.
- [ ] Dependabot covers npm and GitHub Actions updates.

### Testing Requirements

- [ ] Workflow YAML syntax is statically validated or reviewed.
- [ ] Local quality commands used by CI are run or explicitly documented if blocked.
- [ ] E2E workflow behavior is validated locally where practical or documented with a clear reason.
- [ ] Documentation accurately lists required GitHub secrets, variables, and branch protection checks.

### Non-Functional Requirements

- [ ] CI completes in under 10 minutes where practical with caching.
- [ ] Failed tests and E2E runs retain useful artifacts for at least 7 days.
- [ ] Secrets remain runtime-only and are not passed as Docker build args.
- [ ] Workflow permissions follow least privilege.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] Workflow names and check names are stable enough for branch protection.

---

## 8. Implementation Notes

### Key Considerations

- `quality.yml`, `test.yml`, `e2e.yml`, `security.yml`, `deploy.yml`, `release.yml`, and `.github/dependabot.yml` already exist and should be audited before changes.
- `quality.yml` should call the repository's configured scripts, including `npm run type-check`, unless the audit identifies a better project-specific command.
- `security.yml` should align Node.js version and blocking behavior with Phase 01 risk tolerance.
- `deploy.yml` already supports GHCR, webhook, SSH, optional health check, and failure issue creation; the session should verify correctness and document required settings.
- Branch protection is a repository setting, so the implementation should document exact required checks instead of pretending YAML alone blocks merges.

### Potential Challenges

- GitHub repository settings are not represented in code: Mitigate by documenting required checks and environment protection in `docs/CI_CD.md`.
- External actions and major versions may drift: Mitigate through Dependabot's `github-actions` ecosystem and explicit audit notes.
- Playwright CI can be slow or flaky: Mitigate with browser caching, artifact retention, and deterministic test environment setup.
- Deployment target may not be configured yet: Mitigate with a documented no-config path and leave target-specific setup to Session 03.

### Relevant Considerations

- [P00] **Manual testing for shell scripts**: CI should automate local quality and test checks where possible and document anything that still needs manual validation.
- [P00] **jq availability varies**: Workflow shell snippets should avoid hard `jq` requirements or include shell fallbacks.
- [P00] **Demo mode CORS configuration**: CI/CD and deployment docs must preserve strict production CORS and avoid carrying demo-mode permissiveness into production.
- [P00] **Runtime config injection pattern**: Documentation should distinguish build-time `VITE_*` values from runtime server secrets.
- [P00] **ASCII-only output**: Workflow logs and docs should avoid Unicode-only status symbols for reliable terminal and artifact output.

---

## 9. Testing Strategy

### Unit Tests

- Run the unit test command used by CI: `npm run test:run`.
- Run the type-check command used by CI: `npm run type-check`.

### Integration Tests

- Run or document `npm run build` and `npm run test:e2e` parity with the GitHub Actions workflows.
- Validate Docker build/push workflow logic through static inspection and, where feasible, local Docker build parity from Session 01.

### Manual Testing

- Inspect GitHub Actions workflow names and check names for branch protection suitability.
- Review `docs/CI_CD.md`, `docs/DEPLOYMENT.md`, and `README.md` for accurate secrets, variables, and workflow names.

### Edge Cases

- Missing deployment variables should skip deployment after image publication with a clear notice.
- Failed deploy or release workflow should create useful diagnostics without exposing secrets.
- Missing `jq` in a runner step should not make health check output unreadable.
- E2E failures should retain Playwright reports and test result artifacts.
- Pull requests from forks should not receive write-scoped secrets or package publishing access.

---

## 10. Dependencies

### External Libraries

- No new runtime or npm dependencies expected.
- GitHub Actions used by existing workflows should be audited and updated only if needed.

### Other Sessions

- **Depends on**: `phase01-session01-docker-production-optimization`
- **Depended by**: `phase01-session03-cloud-deployment-configuration`
- **Indirectly enables**: `phase01-session04-monitoring-observability`, `phase01-session05-production-security-hardening`

---

## Next Steps

Run the implement workflow step to begin AI-led implementation.
