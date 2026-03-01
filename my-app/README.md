# Task Manager Frontend (my-app)

The Next.js frontend for the Real-time Collaborative Task Manager.

## Tech Stack

- **Framework**: Next.js (React) with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Authentication**: NextAuth.js (Google OAuth)
- **Real-time**: Socket.io client
- **API**: Axios

## Features

- Google OAuth authentication via NextAuth.js
- Personal to-do list (create, edit, delete, complete tasks)
- Task assignment by email
- Real-time updates via Socket.io
- Responsive design for desktop, tablet, and mobile
- Progress tracking per task
- Priority levels (LOW, MEDIUM, HIGH)

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth.js secret (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `http://localhost:5000`) |

## Deployment

Deploy to Vercel with the project root set to `my-app/`.
