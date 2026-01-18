/**
 * Runtime Demo Configuration Template
 *
 * This template is used by configure-urls.sh to generate public/config.js
 * with actual ngrok URLs during demo mode startup.
 *
 * The generated config.js sets window.__DEMO_CONFIG__ which is read by
 * src/lib/apiConfig.ts to override the build-time VITE_API_BASE_URL.
 *
 * Usage:
 *   configure-urls.sh replaces {{BACKEND_URL}} and {{FRONTEND_URL}}
 *   with actual ngrok tunnel URLs, then writes to public/config.js
 *
 * Note: This file is a template and is NOT loaded by the browser.
 *       Only the generated config.js is served during demo mode.
 */
(function() {
  'use strict';
  window.__DEMO_CONFIG__ = {
    apiBaseUrl: '{{BACKEND_URL}}',
    frontendUrl: '{{FRONTEND_URL}}',
    isDemoMode: true,
    generatedAt: '{{GENERATED_AT}}'
  };
})();
