# DevHeaven deployment checklist

## Backend (Render)

Set the service root directory to `backend` and use:

- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`

Required environment variables:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — long random secret, never committed
- `CLIENT_URL` — deployed frontend origin, for example `https://your-app.vercel.app`
- `PORT` — normally supplied by Render; do not hard-code it

Optional local defaults are documented in `backend/.env.example`.

## Frontend (Vercel)

Set the project root to `client` and use the Next.js framework preset.

Required public environment variable:

- `NEXT_PUBLIC_API_URL` — deployed backend base URL, without a trailing slash

Do not put `MONGO_URI` or `JWT_SECRET` in Vercel environment variables intended for the browser.

## MongoDB Atlas

1. Create a database/user for DevHeaven.
2. Rotate any credential that was previously committed to Git.
3. Allow only the required deployment network access where practical.
4. Keep the connection string only in Render's environment variables.

## Smoke tests after deployment

1. Open `GET <backend>/health` and expect HTTP 200.
2. Open `GET <backend>/health/db` and expect HTTP 200 with `database: connected`.
3. Register a test account.
4. Log in and verify the dashboard loads authenticated data.
5. Create a post, like it, and add a comment.
6. Send a message between two test accounts.
7. Verify a Socket.IO connection with a valid JWT and reject a connection without one.
8. Create a recruiter profile and verify a different account cannot create a job using its recruiter ID.
9. Verify Vercel can reach the Render API without CORS errors.

## Security rules

- Never commit `.env` files or credentials.
- Rotate credentials immediately if they appear in Git history.
- Use a strong unique `JWT_SECRET` in production.
- Use HTTPS for both frontend and backend production URLs.
