# Deployment Guide

This guide covers deploying the ElevenLabs Voice Agent to various environments and platforms.

## 🚀 Quick Deploy

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Traditional Hosting
```bash
npm run build
# Upload dist/ folder to your web server
```

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Platforms](#deployment-platforms)
- [Production Optimizations](#production-optimizations)
- [SSL/HTTPS Setup](#ssl-https-setup)
- [Performance Monitoring](#performance-monitoring)
- [CI/CD Pipeline](#ci-cd-pipeline)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **Node.js**: 16.x or higher
- **npm**: 7.x or higher
- **Git**: Latest version
- **SSL Certificate**: Required for voice features (microphone access)

### ElevenLabs Account
- **API Key**: Valid ElevenLabs API key
- **Voice Agent**: Configured voice agent
- **Quota**: Sufficient API quota for expected usage

### Domain & SSL
- **Domain**: Registered domain name
- **SSL Certificate**: Valid SSL certificate (required for microphone access)
- **DNS**: Properly configured DNS records

## 🌍 Environment Configuration

### Environment Variables

Create a `.env.production` file:

```bash
# ElevenLabs Configuration
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here

# Application Configuration
VITE_APP_NAME=ElevenLabs Voice Agent
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# API Configuration
VITE_API_BASE_URL=https://api.elevenlabs.io
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Security
VITE_ALLOWED_ORIGINS=https://yourdomain.com
VITE_CSP_ENABLED=true

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_OFFLINE_MODE=false
```

### Security Configuration

#### Content Security Policy (CSP)
Add CSP headers to your web server:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://api.elevenlabs.io wss://api.elevenlabs.io; 
  media-src 'self' blob:; 
  worker-src 'self' blob:;
```

#### HTTPS Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 🏗️ Build Process

### Production Build
```bash
# Install dependencies
npm ci --production=false

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Build for production
npm run build

# Verify build
npm run preview
```

### Build Optimization
```bash
# Analyze bundle size
npm run build:analyze

# Generate build report
npm run build:report
```

### Build Configuration

#### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          elevenlabs: ['elevenlabs-js-sdk']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})
```

## 🌐 Deployment Platforms

### Vercel (Recommended)

#### Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Configure project
vercel
```

#### `vercel.json` Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_ELEVENLABS_API_KEY": "@elevenlabs-api-key",
    "VITE_ELEVENLABS_AGENT_ID": "@elevenlabs-agent-id"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Netlify

#### Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### `netlify.toml` Configuration
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "16"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### AWS S3 + CloudFront

#### S3 Configuration
```bash
# Create S3 bucket
aws s3 mb s3://your-bucket-name

# Configure bucket for web hosting
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html

# Upload files
aws s3 sync ./dist s3://your-bucket-name --delete
```

#### CloudFront Configuration
```json
{
  "DistributionConfig": {
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-your-bucket-name",
      "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": true,
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {"Forward": "none"}
      }
    },
    "CustomErrorResponses": [
      {
        "ErrorCode": 404,
        "ResponseCode": 200,
        "ResponsePagePath": "/index.html"
      }
    ]
  }
}
```

### Firebase Hosting

#### Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Deploy
firebase deploy
```

#### `firebase.json` Configuration
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Production Optimizations

### Performance Optimizations

#### Bundle Optimization
```bash
# Analyze bundle size
npm run build:analyze

# Tree shake unused code
npm run build:treeshake

# Optimize images
npm run build:optimize-images
```

#### Caching Strategy
```javascript
// Service Worker caching
const CACHE_NAME = 'elevenlabs-voice-agent-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### Security Hardening

#### Environment Variables
```bash
# Never commit these to version control
VITE_ELEVENLABS_API_KEY=sk-...
VITE_ELEVENLABS_AGENT_ID=agent-...

# Use secrets management
vercel secrets add elevenlabs-api-key sk-...
netlify env:set VITE_ELEVENLABS_API_KEY sk-...
```

#### API Key Rotation
```bash
# Regular API key rotation
# 1. Generate new API key in ElevenLabs dashboard
# 2. Update environment variables
# 3. Deploy new version
# 4. Verify functionality
# 5. Revoke old API key
```

## 🔒 SSL/HTTPS Setup

### Why HTTPS is Required
- **Microphone Access**: Browsers require HTTPS for microphone access
- **Security**: Protects API keys and user data
- **SEO**: Search engines prefer HTTPS sites
- **Performance**: HTTP/2 and other optimizations

### SSL Certificate Options

#### Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

#### Cloudflare (Free)
1. Sign up for Cloudflare
2. Add your domain
3. Update nameservers
4. Enable "Always Use HTTPS"

#### Platform SSL
- **Vercel**: Automatic SSL for custom domains
- **Netlify**: Automatic SSL with Let's Encrypt
- **AWS**: Use AWS Certificate Manager

## 📊 Performance Monitoring

### Monitoring Setup

#### Error Tracking
```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Configure Sentry
export SENTRY_DSN=your-sentry-dsn
export SENTRY_ENVIRONMENT=production
```

#### Performance Monitoring
```javascript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### Analytics
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'ElevenLabs Voice Agent',
  page_location: window.location.href
});
```

### Performance Metrics

#### Key Metrics to Monitor
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

#### Voice-Specific Metrics
- **Microphone Access Time**: < 2s
- **Voice Response Time**: < 3s
- **Audio Quality**: No dropped audio
- **API Response Time**: < 1s

## 🔄 CI/CD Pipeline

### GitHub Actions

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
          VITE_ELEVENLABS_AGENT_ID: ${{ secrets.ELEVENLABS_AGENT_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Stages

#### Staging Environment
```bash
# Deploy to staging
vercel --target staging

# Run integration tests
npm run test:integration

# Performance testing
npm run test:performance
```

#### Production Deployment
```bash
# Deploy to production
vercel --prod

# Health check
curl -f https://yourdomain.com/health

# Smoke tests
npm run test:smoke
```

## 🔙 Rollback Procedures

### Automated Rollback
```bash
# Vercel rollback
vercel rollback

# Netlify rollback
netlify rollback

# Custom rollback script
npm run rollback:production
```

### Manual Rollback
1. **Identify Issue**: Monitor logs and metrics
2. **Assess Impact**: Determine severity and user impact
3. **Execute Rollback**: Use platform-specific rollback
4. **Verify**: Confirm rollback was successful
5. **Communicate**: Update stakeholders
6. **Post-Mortem**: Analyze and prevent future issues

### Rollback Checklist
- [ ] Backup current deployment
- [ ] Test rollback in staging
- [ ] Execute rollback
- [ ] Verify functionality
- [ ] Monitor for issues
- [ ] Update monitoring dashboards
- [ ] Document incident

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
npm --version

# Debug build
npm run build:debug
```

#### Environment Variable Issues
```bash
# Verify environment variables
printenv | grep VITE_

# Test API key
curl -H "Authorization: Bearer $VITE_ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/user
```

#### SSL Certificate Issues
```bash
# Check certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Verify chain
ssl-cert-check -c yourdomain.com
```

#### Performance Issues
```bash
# Analyze bundle
npm run build:analyze

# Profile performance
npm run build:profile

# Check CDN cache
curl -I https://yourdomain.com
```

### Health Checks

#### Application Health
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION,
    environment: process.env.VITE_APP_ENVIRONMENT
  });
});
```

#### Voice Features Health
```javascript
// Voice API health check
const checkVoiceAPI = async () => {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] API keys rotated (if needed)
- [ ] Performance tested
- [ ] Security scan completed

### Deployment
- [ ] Backup current version
- [ ] Deploy to staging
- [ ] Integration tests passed
- [ ] Deploy to production
- [ ] Health checks passed
- [ ] Smoke tests completed

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify voice features
- [ ] Test mobile compatibility
- [ ] Monitor user feedback
- [ ] Update documentation

---

## 📞 Support

For deployment issues:
- **Documentation**: Check this deployment guide
- **GitHub Issues**: Create an issue with deployment details
- **Community**: Join our Discord for real-time help
- **Professional**: Contact us for enterprise deployment support

---

**Last Updated**: January 8, 2025
**Next Review**: April 8, 2025

Happy deploying! 🚀