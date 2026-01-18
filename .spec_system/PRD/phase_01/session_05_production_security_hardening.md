# Session 05: Production Security Hardening

**Session ID**: `phase01-session05-production-security-hardening`
**Status**: Not Started
**Estimated Tasks**: ~14
**Estimated Duration**: 2-3 hours

---

## Objective

Harden the application for production deployment with proper security controls, API key protection, rate limiting, and security headers.

---

## Scope

### In Scope (MVP)

- Strict CORS configuration for production origins
- Rate limiting for API endpoints
- Security headers (CSP, HSTS, X-Frame-Options)
- API key validation and rotation support
- Input validation hardening
- Production environment detection

### Out of Scope

- Authentication/authorization system
- WAF configuration
- DDoS protection (rely on cloud platform)
- Penetration testing

---

## Prerequisites

- [ ] Session 03 completed (cloud deployment working)
- [ ] Production domain finalized
- [ ] Rate limiting library selected (express-rate-limit)

---

## Deliverables

1. Rate limiting middleware configuration
2. Security headers middleware (helmet)
3. Production CORS configuration
4. Environment-based security settings
5. Security documentation and best practices guide

---

## Success Criteria

- [ ] Rate limiting active on all API endpoints
- [ ] Security headers pass security scanner (e.g., securityheaders.com)
- [ ] CORS blocks unauthorized origins
- [ ] API keys never exposed to frontend
- [ ] Production vs development modes clearly differentiated
- [ ] Security documentation complete
