# Sonthillu Constructions Associate Partner Portal

## Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript, Zod, JWT
- **Database**: MySQL, Prisma ORM

## Folder Structure
- `/frontend`: React application
- `/backend`: Node.js Express API
- `/prisma`: Database schema and migrations
- `/docs`: Project documentation
- `/uploads`: File uploads

## Startup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL

### Setup
1. Copy `.env.example` to `.env` in the root directory and update variables.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Development Commands
- Start both services (if you have concurrently, otherwise run in separate terminals):
  ```bash
  npm run start:frontend
  npm run start:backend
  ```

### Build Commands
- Build entire project:
  ```bash
  npm run build
  ```
