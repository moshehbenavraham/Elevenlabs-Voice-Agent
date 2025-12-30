# Task Checklist

**Session ID**: `phase04-session01-coolify-deployment`
**Total Tasks**: 20
**Estimated Duration**: 6-8 hours
**Created**: 2025-12-30

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- `[P]` = Parallelizable (can run with other [P] tasks)
- `[S0401]` = Session reference (Phase 04, Session 01)
- `TNNN` = Task ID

---

## Progress Summary

| Category       | Total  | Done   | Remaining |
| -------------- | ------ | ------ | --------- |
| Setup          | 3      | 3      | 0         |
| Foundation     | 5      | 5      | 0         |
| Implementation | 8      | 8      | 0         |
| Testing        | 4      | 4      | 0         |
| **Total**      | **20** | **20** | **0**     |

---

## Setup (3 tasks)

Initial configuration and environment preparation.

- [x] T001 [S0401] Verify Docker installation and node:20-alpine availability
- [x] T002 [S0401] Install compression middleware for static file serving (`package.json`)
- [x] T003 [S0401] Verify current build output structure (`npm run build`)

---

## Foundation (5 tasks)

Core structures and base implementations.

- [x] T004 [S0401] Create .dockerignore with exclusions for dev files (`.dockerignore`)
- [x] T005 [S0401] Create Dockerfile Stage 1: Frontend build stage (`Dockerfile`)
- [x] T006 [S0401] Create Dockerfile Stage 2: Production dependencies stage (`Dockerfile`)
- [x] T007 [S0401] Create Dockerfile Stage 3: Final production image (`Dockerfile`)
- [x] T008 [S0401] Create docker-compose.yml for local testing (`docker-compose.yml`)

---

## Implementation (8 tasks)

Main feature implementation.

- [x] T009 [S0401] Add compression middleware import to server (`server/index.js`)
- [x] T010 [S0401] Add static file serving with express.static (`server/index.js`)
- [x] T011 [S0401] Implement SPA fallback for client-side routing (`server/index.js`)
- [x] T012 [S0401] Add NODE_ENV production detection logic (`server/index.js`)
- [x] T013 [S0401] Add Docker HEALTHCHECK directive to Dockerfile (`Dockerfile`)
- [x] T014 [S0401] Configure non-root user for security in Dockerfile (`Dockerfile`)
- [x] T015 [S0401] [P] Add docker:build npm script (`package.json`)
- [x] T016 [S0401] [P] Add docker:up and docker:down npm scripts (`package.json`)

---

## Testing (4 tasks)

Verification and quality assurance.

- [x] T017 [S0401] Build Docker image and verify size under 200MB
- [x] T018 [S0401] Test docker-compose up and verify all endpoints respond
- [x] T019 [S0401] Validate ASCII encoding on all created files
- [x] T020 [S0401] Update implementation-notes.md with session learnings

---

## Completion Checklist

Before marking session complete:

- [ ] All tasks marked `[x]`
- [ ] Docker image builds successfully
- [ ] Image size under 200MB
- [ ] All provider endpoints respond in container
- [ ] Health check passes within 30 seconds
- [ ] All files ASCII-encoded
- [ ] implementation-notes.md updated
- [ ] Ready for `/validate`

---

## Notes

### Parallelization

Tasks T015 and T016 can be worked on simultaneously as they modify different parts of package.json scripts.

### Task Timing

Target ~20-25 minutes per task.

### Dependencies

- T009-T012 must complete before T017-T018 (server changes needed for container testing)
- T004-T008 are sequential (build Dockerfile in stages)
- T017 depends on all Dockerfile and server changes being complete

### Key Technical Details

**Compression Middleware**: Install `compression` package for gzip static file delivery.

**Static File Serving Order**: Express must register static middleware BEFORE API routes to prevent conflicts. SPA fallback should only catch non-API, non-file requests.

**Dockerfile Layer Optimization**:

1. Copy package\*.json first
2. Run npm ci (cached if package.json unchanged)
3. Copy source files last

**VITE\_\* Variables**: Must be available at BUILD time, not runtime. Pass as build args in docker-compose.

---

## File Change Summary

| File                 | Action | Est. Lines |
| -------------------- | ------ | ---------- |
| `.dockerignore`      | Create | ~20        |
| `Dockerfile`         | Create | ~45        |
| `docker-compose.yml` | Create | ~35        |
| `server/index.js`    | Modify | +20        |
| `package.json`       | Modify | +5         |

---

## Next Steps

Run `/implement` to begin AI-led implementation.
