# Deployment Guide

## Production Deployment Configuration

This guide covers how to deploy the Collective Social frontend for production, including API configuration and authentication considerations.

## Environment Configuration

The frontend uses environment variables to configure the API URL. These are set via Vite's environment variable system.

### Environment Variables

- `VITE_API_URL` - The URL of the backend API server
- `VITE_OPEN_SOCIAL_WEB_URL` - The URL of the Open Social Web server

### Environment Files

- `.env.development` - Used during local development (default: `http://127.0.0.1:3000`)
- `.env.production` - Used when building for production
- `.env.example` - Template file showing required variables

### Setting Up Environment Variables

1. Copy `.env.example` to `.env.development` and/or `.env.production`
2. Update the values to match your deployment:

```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_OPEN_SOCIAL_WEB_URL=https://opensocial.yourdomain.com
```

3. Build the application:

```bash
npm run build
```

The build process will automatically use the appropriate `.env` file based on the mode.

## Authentication & CORS Considerations

### The Challenge

The frontend uses cookie-based authentication with `credentials: 'include'` in fetch requests. In production, when the frontend and API are on different origins (domains/ports), this requires proper CORS configuration.

### Two Deployment Approaches

#### Option 1: Cross-Origin Deployment with CORS (Complex)

Deploy the frontend and API on different domains/origins and configure CORS properly.

**Requirements:**
- API must set `Access-Control-Allow-Origin` to the exact frontend origin (not `*`)
- API must set `Access-Control-Allow-Credentials: true`
- API must handle preflight OPTIONS requests
- Cookies must be set with `SameSite=None; Secure` flags
- Both frontend and API must use HTTPS

**Risks:**
- Browser privacy features (Safari ITP, Firefox ETP) may block third-party cookies
- More complex configuration and debugging
- Potential authentication issues across different browsers
- OAuth callback flows may need adjustment

**Example:**
```
Frontend: https://collectivesocial.github.io
API: https://api.collective.social
```

#### Option 2: Same-Origin Deployment with Reverse Proxy (Recommended)

Deploy both the frontend and API behind the same domain using a reverse proxy.

**Benefits:**
- No CORS configuration needed
- No third-party cookie issues
- Simpler setup and more reliable
- Better browser compatibility
- Easier OAuth flows

**Architecture:**
```
User → https://collective.social/
     → Frontend (SPA) served at /
     → API proxied at /api/*

Reverse Proxy (Cloudflare, nginx, Caddy) routes:
- / → Frontend (GitHub Pages, S3, etc.)
- /api/* → Backend API
- /oauth/* → Backend OAuth endpoints
- /login → Backend login endpoint
- /logout → Backend logout endpoint
```

**Example nginx configuration:**
```nginx
server {
    listen 443 ssl;
    server_name collective.social;

    # Frontend (static files)
    location / {
        proxy_pass https://collectivesocial.github.io;
        proxy_set_header Host collectivesocial.github.io;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend-api:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OAuth endpoints
    location ~ ^/(oauth|login|logout) {
        proxy_pass http://backend-api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Example Cloudflare Workers setup:**
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Route API requests
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/oauth') ||
      url.pathname === '/login' ||
      url.pathname === '/logout') {
    return fetch(request.url.replace(url.origin, 'https://api.collective.social'))
  }

  // Serve frontend
  return fetch(request.url.replace(url.origin, 'https://collectivesocial.github.io'))
}
```

### Recommended Decision: Same-Origin with Reverse Proxy

**We recommend Option 2 (same-origin deployment)** for the following reasons:

1. **Reliability**: Eliminates all cross-origin cookie issues
2. **Simplicity**: No CORS configuration needed
3. **Compatibility**: Works in all browsers without privacy setting issues
4. **Security**: More predictable authentication behavior
5. **Maintenance**: Easier to debug and maintain

### Implementation Steps for Same-Origin Deployment

1. **Choose a reverse proxy solution:**
   - Cloudflare Workers (easiest, built-in CDN)
   - nginx (self-hosted, full control)
   - Caddy (self-hosted, automatic HTTPS)
   - AWS CloudFront (AWS ecosystem)

2. **Configure your custom domain:**
   - Point your domain to the reverse proxy
   - Set up SSL certificates (Let's Encrypt, Cloudflare)

3. **Update environment variables:**
   ```bash
   # .env.production
   # Same origin - no need for full URL
   VITE_API_URL=https://collective.social/api
   VITE_OPEN_SOCIAL_WEB_URL=https://collective.social/opensocial
   ```

4. **Configure reverse proxy routing:**
   - Route `/` to frontend static files
   - Route `/api/*` to backend API
   - Route OAuth endpoints to backend

5. **Update API configuration:**
   - Configure allowed origins (same as frontend domain)
   - Use secure cookies with `SameSite=Strict` or `SameSite=Lax`
   - No need for `SameSite=None`

6. **Deploy and test:**
   - Test login/logout flows
   - Verify authenticated requests work
   - Check OAuth callback URLs

## Building for Production

```bash
# Build with production environment
npm run build

# The dist/ directory contains the production build
# Deploy the contents to your hosting provider
```

## GitHub Pages Deployment

If using GitHub Pages with a reverse proxy:

1. Deploy the built `dist/` folder to GitHub Pages
2. Set up your custom domain in GitHub Pages settings
3. Configure your reverse proxy to route requests
4. Ensure the API URL in `.env.production` points to the proxied API path

## Verifying the Setup

After deployment, verify:

1. Frontend loads correctly from your domain
2. API requests use the correct URL (check browser DevTools Network tab)
3. Login/logout flow works
4. Authenticated requests succeed
5. Cookies are set with correct flags (check DevTools Application tab)
6. OAuth callbacks redirect properly

## Troubleshooting

### Login not working
- Check that cookies are being set (DevTools → Application → Cookies)
- Verify the API URL is correct
- Check CORS headers if using cross-origin setup
- Ensure HTTPS is used for both frontend and API

### API requests failing
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Confirm credentials are being sent (`credentials: 'include'`)

### OAuth redirect issues
- Ensure OAuth callback URL matches your deployment domain
- Check that OAuth endpoints are properly proxied
- Verify the API's OAuth configuration

## Security Considerations

- Always use HTTPS in production
- Keep environment files (`.env`, `.env.local`) out of version control
- Use secure cookie flags appropriate for your deployment
- Regularly update dependencies
- Implement rate limiting on the API
- Use CSP headers to prevent XSS attacks
