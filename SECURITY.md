# Security Configuration

This project has been configured with production-grade security measures.

## Security Features Implemented

### 1. SSL/TLS Encryption
- All database connections use SSL
- HTTPS enforced for all traffic (see redirects in netlify.toml)
- Strict-Transport-Security header enables HSTS

### 2. HTTP Security Headers
The following security headers are configured in `_headers`, `netlify.toml`, and `vercel.json`:

- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **X-Content-Type-Options: nosniff** - Prevents MIME-type sniffing
- **X-XSS-Protection: 1; mode=block** - Enables browser XSS protection
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Permissions-Policy** - Restricts access to browser features (geolocation, camera, microphone)
- **Strict-Transport-Security** - Forces HTTPS for 1 year with subdomains
- **Content-Security-Policy** - Controls which resources can be loaded

### 3. Environment Variables
All sensitive credentials are stored in `.env` file:
- Database passwords
- API keys
- Supabase credentials

The `.env` file is:
- Listed in `.gitignore` (never committed to git)
- Has an `.env.example` template for reference
- Required for all backend scripts

### 4. Database Security
- Connection uses SSL with certificate validation
- Credentials managed through environment variables
- Centralized configuration via `db-config.cjs`

## Deployment Instructions

### For Netlify:
1. Drag and drop the `dist` folder to Netlify
2. Security headers will be automatically applied from `netlify.toml`
3. HTTP to HTTPS redirect is configured

### For Vercel:
```bash
npx vercel --prod
```
Security headers will be automatically applied from `vercel.json`

### Environment Variables Setup:
When deploying, add these environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_DB_PASSWORD` (for backend scripts only)

## Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` for this reason
2. **Rotate credentials regularly** - Especially if they may have been exposed
3. **Use different credentials for production** - Don't use the same keys for dev and prod
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Review CSP policy** - Adjust Content-Security-Policy if adding new third-party services

## Security Checklist

- [x] SSL/TLS enabled for database connections
- [x] HTTP security headers configured
- [x] Environment variables for sensitive data
- [x] .env file in .gitignore
- [x] HTTPS enforced via redirects
- [x] HSTS enabled
- [x] CSP policy configured
- [x] XSS protection enabled
- [x] Clickjacking protection enabled
- [x] MIME-sniffing protection enabled

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.
