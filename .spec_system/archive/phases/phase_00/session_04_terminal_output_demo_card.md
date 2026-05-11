# Session 04: Terminal Output & Demo Card

**Session ID**: `phase00-session04-terminal-output-demo-card`
**Status**: Not Started
**Estimated Tasks**: ~12
**Estimated Duration**: 2-3 hours

---

## Objective

Create polished terminal output with clear status messages, a shareable demo card containing the demo URL, local URL, optional credentials, and comprehensive documentation.

---

## Scope

### In Scope (MVP)

- Format terminal output with clear sections (startup, URLs, status)
- Generate shareable demo card with demo URL, local URL, and optional credentials
- Include basic auth credentials in demo card (if configured)
- Display ngrok installation instructions (always shown for open-source users)
- Add quick-start instructions for demo recipients
- Create copy-paste friendly URL format
- Add color coding for status messages (success/warning/error)
- Ensure output is accessible (no emoji-only status, screen reader friendly)
- Update project README with demo mode documentation

### Out of Scope

- QR code generation for mobile testing (deferred)
- GUI/web-based status dashboard
- Real-time connection monitoring

---

## Prerequisites

- [ ] Session 03 completed (URLs configured, services running)
- [ ] All voice providers tested through ngrok

---

## Deliverables

1. `scripts/ngrok/output-formatter.sh` - Terminal output formatting functions
2. `scripts/ngrok/demo-card.sh` - Shareable demo card generator
3. Updated `README.md` with demo mode section
4. `docs/DEMO_MODE.md` - Comprehensive demo mode documentation

---

## Success Criteria

- [ ] Terminal shows demo and local URLs clearly on startup
- [ ] Demo card is copy-paste ready with URLs and credentials
- [ ] ngrok installation instructions always displayed
- [ ] Status messages use color coding (green/yellow/red)
- [ ] No emoji-only status indicators (text always included)
- [ ] README documents `npm run demo` usage
- [ ] DEMO_MODE.md covers troubleshooting, environment variables, and provider notes
