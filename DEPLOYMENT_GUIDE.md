# Sonthillu Associate Partner Portal - Deployment Guide

This guide explains how to deploy the production build of the Sonthillu Associate Partner Portal on platforms like Hostinger, Render, or any standard Linux/cPanel VPS.

## Prerequisites

- Node.js v18 or later
- MariaDB / MySQL server
- Production domain (e.g. `associatepartner.sonthilluconstructions.com`)

## Environment Variables

### Backend `.env`
```
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://username:password@hostname:3306/db_name"
JWT_SECRET="your-secure-random-jwt-secret"
COOKIE_SECRET="your-secure-random-cookie-secret"
FRONTEND_URL="https://associatepartner.sonthilluconstructions.com"
UPLOAD_PATH="/path/to/persistent/storage/uploads"
```

### Frontend `.env`
```
VITE_API_URL="https://associate-partner-api.onrender.com/api"
```
*(Note: Create this file at `frontend/.env` before building)*

---

## 1. Database Setup

1. Create a MySQL/MariaDB database.
2. Ensure the `DATABASE_URL` is set correctly in your backend environment.
3. Deploy the schema safely:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate deploy
   ```
   **Warning:** NEVER use `prisma migrate dev` or `prisma db push` in production. Always use `prisma migrate deploy` which safely runs existing migrations.

---

## 2. Backend Deployment

1. Install dependencies:
   ```bash
   cd backend
   npm install --omit=dev
   ```
2. Build the TypeScript source:
   ```bash
   npm run build
   ```
3. Start the application:
   ```bash
   npm run start
   # This runs: node dist/server.js
   ```
4. **Important Considerations:**
   - Ensure you are using a process manager like PM2 if deploying on a VPS.
   - Configure HTTPS/SSL at your reverse proxy (Nginx, Apache, or Hostinger panel).
   - Ensure the `UPLOAD_PATH` points to a persistent directory that survives redeployments.

---

## 3. Frontend Deployment

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Ensure `frontend/.env` contains the correct `VITE_API_URL` pointing to the public URL of your backend.
3. Build the application:
   ```bash
   npm run build
   ```
4. Upload the contents of the `frontend/dist` directory to your static hosting provider (e.g. Hostinger File Manager, Render Static Site, Vercel, Netlify).
5. **SPA Rewrite Rules (Critical):**
   - Since this is a React Router application, all routing is client-side.
   - If using Apache (cPanel/Hostinger), create a `.htaccess` file in the root of the `dist` folder:
     ```apache
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
     </IfModule>
     ```
   - If using Nginx:
     ```nginx
     location / {
       try_files $uri $uri/ /index.html;
     }
     ```

## 4. Final Verification

- Verify the PWA installs correctly (HTTPS is strictly required).
- Verify uploads are saving to the correct directory and are publicly accessible via the randomized URLs.
- Verify that logging in correctly sets the `HttpOnly` and `Secure` cookie.
