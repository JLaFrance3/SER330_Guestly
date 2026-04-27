# Guestly — Build Summary

## What Was Built

Guestly is a full-stack restaurant reservation application with two distinct personas: **Guest** (books and manages their own reservations) and **Host** (oversees all reservations and manages seating).

### Backend (Express.js / Node.js)

- **Runtime**: Node.js 18+, Express 4.x on port 3001
- **Storage**: Local JSON file (`database.json`) — no external database required
- **Auth**: Simple base64-encoded token scheme (no external auth library). Token embeds `{ id, username, role }` and is verified on every protected request.
- **9 REST endpoints** covering all user stories US01–US09:
  - `POST /api/auth/login` — credential check, returns session token
  - `GET /api/reservations` — role-scoped list (host sees all, guest sees own)
  - `POST /api/reservations` — create reservation with validation
  - `GET /api/reservations/availability` — 30-min slot availability for a date
  - `GET /api/reservations/:id` — single reservation (ownership enforced)
  - `PATCH /api/reservations/:id/status` — status transitions (role rules enforced)
  - `PATCH /api/reservations/:id` — edit details (30-min lockout for guests)
  - `DELETE /api/reservations/:id` — soft-cancel (sets status to Cancelled)
  - `POST /api/reservations/walkin` — host walk-in, instantly sets status Seated

### Frontend (React / TypeScript / Vite)

- **Framework**: Vite + React 18 + TypeScript
- **UI library**: react-bootstrap with custom CSS variables
- **Routing**: React Router v6 with role-based ProtectedRoute guards
- **State**: React Context for auth (token + user stored in localStorage)

#### Pages Built
| Page | Persona | User Stories |
|---|---|---|
| LoginPage | Both | US06 |
| BookingPage | Guest | US01, US02, US05 |
| MyReservationsPage | Guest | US07, US09 |
| ReservationDetailPage | Guest | US04 |
| EditReservationPage | Guest | US09 |
| DashboardPage | Host | US03, US04, US07 |
| WalkInPage | Host | US08 |
| ManageReservationsPage | Host | US04, US07 |

## Key Design Decisions

### JSON File Storage
Chosen for simplicity and zero external dependencies. All reads/writes go through `utils/db.js` helpers using synchronous `fs` calls. This is appropriate for a local-only development tool; a production version would use a proper database.

### Token Scheme
Base64-encoded JSON rather than a JWT library keeps the dependency footprint minimal while still allowing the server to verify identity and role on every request. The token is sent as `Authorization: Bearer <token>` on all protected API calls.

### Capacity Model
Restaurant capacity is modelled at 50 total guests per 30-minute slot (sum of `partySize` across Confirmed + Seated reservations). Individual table max is 12 guests (US05). These constants are defined inline and easy to change.

### 30-Minute Lockout (US09)
Enforced both on the backend (`PATCH /api/reservations/:id` returns 403 if within window) and in the frontend (Edit button disabled, page shows warning). Past reservations are also locked, matching the backend's `resTime - now < 30min` condition.

### Role Separation
- Guests: can only see and manage their own reservations; status is read-only; cannot cancel Seated reservations; subject to edit lockout.
- Hosts: see all reservations; can change any status including cancelling Seated parties; bypass edit lockout; can create walk-ins.
- Wrong-role navigation redirects to the user's home page rather than the login page to avoid a confusing "logged out" appearance.

### Styling
Warm restaurant palette (burgundy `#722F37`, gold `#C9A84C`, cream `#FAF8F5`) via CSS custom properties layered over react-bootstrap. See `docs/style-guide.md` for full details.

## Running Locally

```bash
npm install
cd frontend && npm install && cd ..
npm run dev        # starts backend on :3001 and frontend on :5173 concurrently
```

Default credentials: `host / host123`, `alice / alice123`, `bob / bob123`.
