# Session Specification

**Session ID**: `phase00-session04-terminal-output-demo-card`
**Phase**: 00 - Ngrok Demo Mode Integration
**Status**: Not Started
**Created**: 2026-01-18

---

## 1. Session Overview

This session completes Phase 00 by adding the user-facing polish layer to the ngrok demo mode infrastructure. Sessions 01-03 established the technical foundation: ngrok detection, startup orchestration, and dynamic URL configuration. This final session focuses on the human experience - clear terminal output, a shareable demo card, and comprehensive documentation.

The primary deliverable is an enhanced terminal experience when running `npm run demo`. Users will see color-coded status messages, a formatted demo card with all URLs and credentials ready to share, and helpful quick-start instructions. The session also produces documentation that enables both demo recipients and open-source contributors to understand and use the demo mode effectively.

This work transforms the demo mode from a functional but utilitarian tool into a polished feature that makes a good impression on demo recipients and reduces support questions through clear, self-documenting output.

---

## 2. Objectives

1. Create a reusable output formatting library for consistent terminal styling across all ngrok scripts
2. Generate a copy-paste friendly demo card displaying frontend URL, backend URL, and auth credentials
3. Update README.md with a prominent demo mode section and quick-start instructions
4. Create comprehensive DEMO_MODE.md documentation covering setup, troubleshooting, and provider-specific notes

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-ngrok-configuration-detection` - Provides ngrok.yml and detect-ngrok.sh
- [x] `phase00-session02-demo-startup-orchestration` - Provides demo.sh orchestration script
- [x] `phase00-session03-dynamic-url-configuration` - Provides URL extraction and config generation

### Required Tools/Knowledge

- Bash scripting with ANSI escape codes for terminal colors
- Understanding of terminal capabilities (TERM variable, NO_COLOR support)
- Familiarity with heredoc strings for multiline output
- Markdown documentation best practices

### Environment Requirements

- Unix-like environment (Linux/macOS/WSL)
- Bash 4.0+ (for associative arrays if needed)
- Terminal with color support (graceful degradation for non-color terminals)

---

## 4. Scope

### In Scope (MVP)

- `scripts/ngrok/output-formatter.sh` with reusable formatting functions
- `scripts/ngrok/demo-card.sh` for generating shareable demo information
- Enhanced `display_urls()` function in demo.sh using the formatter
- Color-coded status messages (green=success, yellow=warning, red=error, blue=info)
- NO_COLOR environment variable support for accessibility
- Screen reader friendly output (text descriptions, not just colors)
- README.md demo mode section with quick-start example
- `docs/DEMO_MODE.md` comprehensive documentation

### Out of Scope (Deferred)

- QR code generation - _Reason: Requires additional dependencies (qrencode), adds complexity_
- GUI/web-based status dashboard - _Reason: Out of scope for CLI-focused demo mode_
- Real-time connection monitoring - _Reason: Future enhancement, current polling approach sufficient_
- Slack/Discord webhook notifications - _Reason: Phase 01+ feature if demand exists_

---

## 5. Technical Approach

### Architecture

The output formatting layer follows a library pattern where `output-formatter.sh` provides reusable functions that can be sourced by any script. The demo card generator (`demo-card.sh`) sources the formatter and constructs a bordered, copy-paste friendly display. The main `demo.sh` orchestrator integrates these components at the end of successful startup.

```
demo.sh (orchestrator)
    |
    +-- sources --> output-formatter.sh (formatting library)
    |
    +-- calls --> demo-card.sh (after successful startup)
                      |
                      +-- sources --> output-formatter.sh
```

### Design Patterns

- **Library Pattern**: output-formatter.sh as a sourceable function library
- **Progressive Enhancement**: Colors enabled by default, gracefully disabled via NO_COLOR or non-TTY
- **Defensive Scripting**: set -euo pipefail, shellcheck compliance, proper quoting

### Technology Stack

- Bash 4.0+ with POSIX-compatible fallbacks where possible
- ANSI escape sequences for colors (with terminal capability detection)
- printf for consistent formatting (not echo with -e which varies by shell)

---

## 6. Deliverables

### Files to Create

| File                                | Purpose                                                                   | Est. Lines |
| ----------------------------------- | ------------------------------------------------------------------------- | ---------- |
| `scripts/ngrok/output-formatter.sh` | Reusable terminal formatting functions (colors, boxes, status indicators) | ~120       |
| `scripts/ngrok/demo-card.sh`        | Generates shareable demo card with URLs and credentials                   | ~150       |
| `docs/DEMO_MODE.md`                 | Comprehensive demo mode documentation                                     | ~200       |

### Files to Modify

| File              | Changes                                                                | Est. Lines |
| ----------------- | ---------------------------------------------------------------------- | ---------- |
| `scripts/demo.sh` | Replace inline display_urls() with demo-card.sh call, source formatter | ~30        |
| `README.md`       | Add demo mode section with quick-start instructions                    | ~40        |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Running `npm run demo` displays color-coded startup progress
- [ ] Demo card shows frontend URL, backend URL, and local URLs clearly
- [ ] Demo card is copy-paste ready (no trailing escape codes)
- [ ] ngrok installation instructions always displayed for first-time users
- [ ] Status messages include text labels (not just colors) for accessibility
- [ ] Setting `NO_COLOR=1` disables all color output

### Testing Requirements

- [ ] Manual testing in color-capable terminal (iTerm2, GNOME Terminal, Windows Terminal)
- [ ] Manual testing with `NO_COLOR=1` environment variable
- [ ] Manual testing with output piped to file (non-TTY)
- [ ] Shellcheck passes on all new/modified shell scripts
- [ ] Demo card copy-paste test in Slack/Discord

### Quality Gates

- [ ] All files ASCII-encoded (0-127 characters only)
- [ ] Unix LF line endings
- [ ] Executable permissions on .sh files (chmod +x)
- [ ] No trailing whitespace
- [ ] Scripts pass `shellcheck` with zero warnings

---

## 8. Implementation Notes

### Key Considerations

- Terminal width detection is unreliable; use fixed-width demo card (60-70 chars) that fits most terminals
- Basic auth credentials come from ngrok.yml if configured; parse or accept as environment variable
- The demo card should work even if backend/frontend haven't fully started (display URLs regardless)
- Consider colorblind users: don't rely solely on red/green distinction, use text labels

### Potential Challenges

- **Terminal Color Detection**: Some terminals report capabilities incorrectly. Mitigation: Check both TERM and -t 1 (isatty), honor NO_COLOR.
- **Copy-Paste Cleanliness**: Escape sequences can pollute clipboard. Mitigation: Test extensively, avoid embedding ANSI codes in the demo card border itself.
- **Cross-Shell Compatibility**: bash vs zsh differences in printf. Mitigation: Use POSIX-compliant printf patterns, test in both shells.

### Relevant Considerations

No active concerns or lessons learned from CONSIDERATIONS.md apply to this session - this is the first project phase with no accumulated technical debt or lessons.

### ASCII Reminder

All output files must use ASCII-only characters (0-127). Use standard ASCII box-drawing characters like +, -, |, or simple equals signs for borders rather than Unicode box-drawing characters.

---

## 9. Testing Strategy

### Unit Tests

- Not applicable (shell scripts, manual testing approach)

### Integration Tests

- Run full `npm run demo` startup and verify output formatting
- Verify demo card displays correctly after URL configuration
- Test graceful degradation when ngrok not installed

### Manual Testing

1. Start demo mode: `npm run demo`
2. Verify color-coded status messages appear during startup
3. Verify demo card displays with clear URLs section
4. Copy demo card output and paste in text editor - verify no escape codes
5. Test with `NO_COLOR=1 npm run demo` - verify plain text output
6. Test with `npm run demo | tee output.log` - verify non-TTY handling
7. Test on macOS Terminal, iTerm2, Windows Terminal (if available)

### Edge Cases

- ngrok tunnels fail to start (error formatting should still work)
- Basic auth not configured (demo card should omit auth section gracefully)
- Very narrow terminal (< 60 chars) - demo card should not wrap badly
- Non-UTF8 locale - ASCII-only output ensures compatibility

---

## 10. Dependencies

### External Libraries

- None (pure Bash implementation)

### Other Sessions

- **Depends on**: phase00-session01, phase00-session02, phase00-session03 (all completed)
- **Depended by**: None (this completes Phase 00)

---

## Next Steps

Run `/tasks` to generate the implementation task checklist.
