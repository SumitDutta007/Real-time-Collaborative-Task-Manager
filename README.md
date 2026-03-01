# Real-time Collaborative Task Manager

A premium, full-stack, real-time collaborative task management app with Google authentication, task assignment, and live updates. Built with Next.js, Node.js (TypeScript), PostgreSQL (Supabase), Tailwind CSS, and deployed on Vercel & Render.

---

## 🚀 Live Demo

- **Frontend:** [https://real-time-collaborative-task-manage.vercel.app](https://real-time-collaborative-task-manage.vercel.app)
- **Backend API:** [https://real-time-collaborative-task-manager.onrender.com](https://real-time-collaborative-task-manager.onrender.com)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
- **Backend:** Node.js (Express, TypeScript), Socket.io (real-time), Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Authentication:** NextAuth.js (Google OAuth)
- **Deployment:** Vercel (frontend), Render (backend)

---

## ✨ Features

- **Google Authentication**: Secure login with Google via NextAuth.js
- **Personal To-Do List**: Create, edit, delete, and complete tasks
- **Task Assignment**: Assign tasks to users by email (auto-link if user joins later)
- **Real-time Updates**: Instant UI updates for task changes and assignments
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Premium UI/UX**: Modern, animated, and accessible interface
- **State Feedback**: Loading skeletons, toasts, and error messages

---

## 📦 Project Structure

```
├── backend/         # Node.js API (Express, TypeScript, Prisma)
│   ├── src/
│   ├── prisma/
│   └── ...
├── my-app/          # Next.js frontend (React, Tailwind CSS)
│   ├── app/
│   ├── components/
│   └── ...
├── .env.example     # Example environment variables
└── README.md        # This file
```

---

## 🏗️ Deployment Steps

### Backend (Render)
1. Push code to GitHub.
2. Create a new Web Service on [Render](https://render.com/).
3. Set root directory to project root.
4. **Build Command:** `cd backend && npm install && npm run build`
5. **Start Command:** `cd backend && npm start`
6. Add environment variables from above.
7. Deploy and note your backend URL.

### Frontend (Vercel)
1. Import your repo on [Vercel](https://vercel.com/).
2. Set project root to `my-app`.
3. Add environment variables from above.
4. Deploy and note your frontend URL.

---

## 📝 Architectural Decisions
- **Monorepo:** Both frontend and backend in a single repository for easier management.
- **Supabase:** Used for managed PostgreSQL hosting and pooling.
- **Socket.io:** Enables real-time task updates and collaboration.
- **NextAuth.js:** Secure, production-ready Google OAuth.
- **Prisma:** Type-safe ORM for PostgreSQL.

---

## 🧪 Testing
- Create tasks, assign to users, and verify real-time updates.
- Test on desktop, tablet, and mobile for responsive UI.
- Try assigning tasks to emails not yet registered (auto-link on signup).

---

## 📄 API Documentation
- See `API_DOCUMENTATION.md` and `Task-Manager-API.postman_collection.json` for full API reference and sample requests.

---


## 👨‍💻 Author
Sumit Dutta ([SumitDutta007](https://github.com/SumitDutta007))

---

## 📢 Assignment Requirements Checklist
- [x] Google Authentication
- [x] Personal To-Do List
- [x] Task Assignment by Email
- [x] Real-time Updates
- [x] Premium, Responsive UI/UX
- [x] Public Deployment (Vercel + Render)
- [x] Secure Environment Variable Management

---

**Thank you!**
