# Security Policy

Voice-Agent-PuPuPlatter is a multi-provider voice AI demo platform. The Express
server is the security boundary for provider credentials and browser-safe
session material.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| < 1.0   | No        |

Security updates are provided for the latest stable release. Operators should
upgrade promptly when security fixes are released.

## Reporting A Vulnerability

Do not create public GitHub issues for security vulnerabilities and do not
disclose issues publicly until maintainers have completed triage and response.

Send reports to:

- Email: security@voice-agent-pupuplatter.dev
- Subject: `[SECURITY] Voice-Agent-PuPuPlatter - <brief description>`
- Expected acknowledgment: within 48 hours

Include:

- A clear vulnerability description
- Reproduction steps
- Affected version, commit, or deployment context
- Potential impact
- Suggested mitigation, if known
- Contact information for follow-up

## Response Timeline

| Step               | Target                                           |
| ------------------ | ------------------------------------------------ |
| Acknowledgment     | Within 48 hours                                  |
| Initial assessment | Within 1 week                                    |
| Fix development    | 2-4 weeks depending on severity and complexity   |
| Release            | As soon as a safe fix is ready                   |
| Advisory           | After affected operators have had time to update |

Critical vulnerabilities may be handled faster when exploitation risk is high.

## Production Hardening

See [Production Security Hardening](SECURITY_HARDENING.md) for the operational
control guide covering:

- Exact-origin production CORS
- Security headers and CSP posture
- Token/session route rate limiting
- Provider payload validation
- Gemini production key-exposure guard
- API key rotation
- Scanner verification
- Known deferrals

## Credential Handling

- Never commit `.env` files or provider API keys.
- Keep provider API keys as runtime server secrets only.
- Never expose provider API keys through `VITE_*` variables.
- Do not put secrets in logs, issue text, screenshots, or support messages.
- Rotate provider keys regularly and immediately after suspected exposure.
- Use different keys for development, staging, and production.

## Browser And Audio Privacy

- Use HTTPS in production so microphone access and secure WebSockets work.
- Request microphone permission explicitly in the browser.
- Process audio in memory when possible.
- Avoid storing audio or transcripts unless a future feature explicitly
  documents retention, consent, and deletion behavior.
- Do not log raw audio, transcripts, authorization headers, cookies, request
  bodies, or provider response bodies.

## OpenAI Translation Privacy And Usage Controls

- OpenAI Translation uses a separate browser WebRTC flow from the OpenAI
  voice-agent provider.
- The backend route `POST /api/openai/translation-session` mints short-lived
  client secrets with server-side `OPENAI_API_KEY`; the browser receives only
  browser-safe session fields.
- The route is covered by the strict token limiter and duplicate in-flight
  guard, but these controls are process-local until a shared-store or
  platform-level limiter is added.
- The browser max-session guard defaults to 30 minutes and caps configured
  values above 120 minutes.
- Translation lifecycle logs include only sanitized metadata: request ID,
  route, target language, status category/code, result, duration config source,
  and safety-identifier status.
- Translation lifecycle logs exclude raw request bodies, raw upstream bodies,
  client secrets, API keys, cookies, authorization headers, audio, transcripts,
  and SDP payloads.
- `OpenAI-Safety-Identifier` remains deferred until the app has a stable
  non-PII app identifier. Do not derive it from IP address, user agent, cookies,
  authorization headers, transcripts, audio, or provider responses.

## Server-Side Controls

Production deployments should enforce:

- Strict exact-origin CORS through `CORS_ORIGIN`
- CSP, HSTS, frame prevention, no-sniff, referrer policy, and permissions policy
- Explicit JSON body limits
- Broad API rate limiting and stricter token/session rate limiting
- Server-side validation for provider and function routes
- Safe error responses that do not expose stack traces, internal paths, provider
  response bodies, or secrets

## Dependency And CI Security

The repository includes GitHub Actions workflows for quality, tests, builds, E2E
checks, security scanning, and deployment. Security checks include secret
scanning, CodeQL, dependency review, and npm audit according to the CI/CD guide.

Operators should:

- Review dependency updates before production deployment.
- Treat high-severity dependency issues as blocking unless a documented
  exception exists.
- Keep GitHub branch protection aligned with the CI/CD guide.

## Incident Response

Follow [Incident Response](runbooks/incident-response.md) for triage and
containment.

Open an incident when:

- A raw provider API key appears in a browser response, browser console, network
  capture, log, issue, screenshot, or support artifact.
- Production CORS allows `*` or an unauthorized origin.
- Security headers disappear from production responses.
- Token/session routes lose the stricter limiter.
- Provider routes accept malformed or oversized payloads and call upstream APIs.
- `/api/health` reports `unhealthy` because of unsafe production security
  configuration.

## Compliance Notes

This project does not currently provide user accounts, tenant isolation,
persistent storage, or a formal data processing agreement. Deployments that
serve real users are responsible for assessing privacy, consent, retention,
regional compliance, and provider terms.

Potentially relevant frameworks include GDPR, CCPA, OWASP guidance, and the
hosting platform security model. Enterprise or regulated deployments should add
a formal privacy and compliance review before launch.

## Security Contacts

- Security: security@voice-agent-pupuplatter.dev
- Development: dev@voice-agent-pupuplatter.dev
- Operations: ops@voice-agent-pupuplatter.dev

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Web Audio API Security Considerations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Security)

---

**Last Updated**: May 11, 2026
**Next Review**: August 11, 2026
