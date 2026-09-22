# DevHeaven API

The API is mounted below the `/api` prefix. Configure the client with the
backend origin (for example, `https://devheaven-2.onrender.com`), then call
`https://devheaven-2.onrender.com/api/...`.

## Authentication

### Register

`POST /api/auth/register`

Accepts JSON or `multipart/form-data` when uploading an optional `profile`
image. The required fields are `firstName`, `lastName`, `email`, `username`,
and `password`. Passwords must be at least eight characters and include an
uppercase letter, lowercase letter, and number.

```json
{
  "firstName": "Dev",
  "lastName": "User",
  "email": "dev@example.com",
  "username": "devuser",
  "password": "SecurePass1"
}
```

Returns `201 Created` with a public user object. Sign in separately to receive
a JWT.

### Login

`POST /api/auth/login`

```json
{
  "identifier": "devuser",
  "password": "SecurePass1"
}
```

`identifier` may be a username or email address. A successful response returns
the JWT in `token` and the public user object in `user`. Supply that token on
protected endpoints using `Authorization: Bearer <token>`.

### Current user

`GET /api/auth/me` (authentication required)

Returns the authenticated user's public profile.

### Password reset

- `POST /api/auth/forgot-password` with `{ "email": "dev@example.com" }`
- `POST /api/auth/reset-password` with `{ "token": "...", "password": "SecurePass1" }`

The reset email is sent only when the account and email provider configuration
are available. Reset links expire after 30 minutes.

## Core resources

All endpoints below use the `/api` prefix:

| Resource | Examples |
| --- | --- |
| Users | `GET /api/users` (authenticated), `GET /api/users/:id`, `PUT /api/users/me` (authenticated) |
| Posts | `GET /api/posts`, `POST /api/posts` (authenticated), `POST /api/posts/:id/comments` (authenticated) |
| Messages | `GET /api/messages`, `POST /api/messages` (authenticated) |
| Recruiters and jobs | `GET /api/recruiters`, `GET /api/jobs`, recruiter management endpoints (authenticated) |
| Projects and resources | `GET /api/projects`, `POST /api/projects` (authenticated), `GET /api/resources` |
| Network | `GET /api/connections`, `GET /api/network/suggestions` (authenticated) |
| Notifications | `GET /api/notifications` (authenticated) |

Refer to the route handlers in `backend/routes/` for the current endpoint
parameters and response shapes. The service also provides `GET /health` and
`GET /health/db` for deployment health checks.
