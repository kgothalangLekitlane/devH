# DevHeaven

DevHeaven is a full-stack community platform for developers and recruiters to connect, share opportunities, discover resources, and communicate in one place.

## 🌟 Features

- JWT-based authentication
- Community posts and project sharing
- Recruiter and candidate discovery
- Messaging between users
- Curated development resources
- Responsive Next.js + Tailwind client

## 🧱 Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel (client), Render (backend)

## 📁 Project Structure

- `backend/` — Express API and MongoDB models
- `client/` — Next.js web application

## 🔌 API Overview

Key backend routes include:

- `POST /api/auth/register` — Register a user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/users` — Fetch users (protected)
- `GET /api/messages` / `POST /api/messages` — Messaging
- `GET /api/recruiters` — Recruiter directory
- `GET /api/resources` — Learning resources

## ⚙️ Environment Variables

Create a `.env` file in `backend/` (or configure on Render):

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## 🚀 Local Development

1. Clone the repository
2. Install dependencies:
   - `cd backend && npm install`
   - `cd ../client && npm install`
3. Configure environment variables
4. Start the backend:
   - `cd backend && npm start`
5. Start the frontend:
   - `cd client && npm run dev`

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

## 📄 License

MIT

<!-- Deployment sync marker: keep Git/Vercel production deployment state aligned. -->
