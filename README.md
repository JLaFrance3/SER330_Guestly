# Guestly — Restaurant Reservation API

![AI-Authored](https://img.shields.io/badge/Authored_by-Claude_Autonomous-blueviolet)
![Environment](https://img.shields.io/badge/Env-Hardened_VM-green)

Guestly is a full-stack restaurant reservation management app. This repo contains the Express.js backend API and a React/Vite frontend.

## Prerequisites

- Node.js 18+
- npm 9+

## Installation & Running

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run both backend and frontend concurrently
npm run dev
```

- API: http://localhost:3001
- Frontend: http://localhost:5173

### Other scripts

| Script           | Description                              |
| ---------------- | ---------------------------------------- |
| `npm start`      | Run API server (production)              |
| `npm run server` | Run API server with nodemon (watch mode) |
| `npm run client` | Run frontend dev server only             |
| `npm run lint`   | Run ESLint                               |
| `npm run format` | Run Prettier                             |

## Default Credentials

| Username | Password | Role  |
| -------- | -------- | ----- |
| host     | host123  | host  |
| alice    | alice123 | guest |
| bob      | bob123   | guest |

## Authentication

All reservation endpoints require a Bearer token obtained via login.

**Token format:** Base64-encoded JSON `{ id, username, role }`

Include in requests:

```
Authorization: Bearer <token>
```

---

## API Endpoints

### Auth

#### POST /api/auth/login

Login and receive a session token.

**Request body:**

```json
{ "username": "host", "password": "host123" }
```

**Response:**

```json
{
  "token": "<base64-token>",
  "user": { "id": "host-001", "username": "host", "role": "host" }
}
```

---

### Reservations

All endpoints require `Authorization: Bearer <token>`.

#### GET /api/reservations

Get reservations. Hosts see all; guests see only their own.

**Response:** Array of reservation objects.

---

#### POST /api/reservations

Create a new reservation.

**Auth:** Any authenticated user

**Request body:**

```json
{
  "name": "Alice Smith",
  "partySize": 4,
  "datetime": "2024-08-15T18:30:00",
  "notes": "Window seat preferred"
}
```

**Response (201):** Created reservation object with `status: "Confirmed"`.

**Errors:**

- `400` — Missing/invalid fields, or partySize > 12 (`"Max Capacity Exceeded"`)

---

#### GET /api/reservations/availability?date=YYYY-MM-DD

Get available 30-minute slots for a date. A slot is unavailable when total confirmed/seated party sizes >= 50.

**Auth:** Any authenticated user

**Response:**

```json
[
  { "time": "2024-08-15T09:00:00", "available": true, "remainingCapacity": 50 },
  { "time": "2024-08-15T09:30:00", "available": false, "remainingCapacity": 0 }
]
```

---

#### GET /api/reservations/:id

Get a single reservation by ID.

**Auth:** Host (any), Guest (own only)

---

#### PATCH /api/reservations/:id/status

Update reservation status.

**Auth:** Host can set any status. Guest can only set `"Cancelled"` (and not when status is already `"Seated"`).

**Request body:**

```json
{ "status": "Seated" }
```

Valid statuses: `Confirmed`, `Seated`, `Completed`, `Cancelled`

**Errors:**

- `403` — Guest trying to set non-Cancelled status, or cancelling a Seated reservation

---

#### PATCH /api/reservations/:id

Update reservation details (name, partySize, datetime, notes).

**Auth:** Host (any time). Guest blocked within 30 minutes of reservation time.

**Request body:** Any subset of `{ name, partySize, datetime, notes }`

**Errors:**

- `403` — Guest editing within 30 min: `{ "error": "Contact Host" }`
- `400` — Invalid field values or partySize > 12

---

#### DELETE /api/reservations/:id

Soft-cancel a reservation (sets status to `"Cancelled"`).

**Auth:** Host (any). Guest (own only, not if already `"Seated"`).

---

#### POST /api/reservations/walkin

Host-only. Create a walk-in reservation with status immediately set to `"Seated"`.

**Auth:** Host only

**Request body:**

```json
{
  "name": "Walk-in Party",
  "partySize": 3,
  "datetime": "2024-08-15T19:00:00"
}
```

**Response (201):** Reservation object with `status: "Seated"`.

---

## Data Storage

All data is persisted in `database.json` at the project root using synchronous file I/O. No external database is required.

### Reservation object shape

```json
{
  "id": "uuid",
  "name": "Guest Name",
  "partySize": 4,
  "datetime": "2024-08-15T18:30:00",
  "notes": "",
  "status": "Confirmed",
  "userId": "guest-001",
  "createdAt": "2024-08-15T12:00:00.000Z"
}
```

Possible statuses: `Confirmed`, `Seated`, `Completed`, `Cancelled`
