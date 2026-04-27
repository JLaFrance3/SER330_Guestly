# Guestly QA Test Report
Date: 2026-04-27
Reviewer: QA Agent

## Summary

Overall the implementation is solid. All 9 user stories are implemented end-to-end. The backend is fully correct — every business rule (party size limits, 30-min lockout, walk-in seating, role-based cancellation, availability slots) is properly enforced. The integration layer is clean with consistent field names, route paths, and auth headers.

One **Major bug** was found: the guest edit page (`/guest/reservations/:id/edit`) is missing from the React Router configuration in `App.tsx`. The Edit button in `MyReservationsPage` navigates to that route, but it falls through to the catch-all wildcard and redirects to `/`, making US09's edit-before-lockout flow non-functional from the UI. The backend PATCH endpoint is correctly implemented; the gap is purely in the frontend routing.

Four **Minor** issues round out the findings. No critical or blocking issues beyond the missing edit page.

**Overall: 27 PASS / 1 FAIL / 4 MINOR**

---

## Backend Results

| Check | Status | Notes |
|-------|--------|-------|
| BC-01: partySize validation 1–12 (US01, US05) | PASS | `validateReservation` correctly rejects ≤0 and >12; returns "Max Capacity Exceeded" for >12 (`routes/reservations.js:17–27`) |
| BC-02: Required fields (name, datetime) (US01) | PASS | Missing/blank name or invalid datetime returns 400 (`routes/reservations.js:14–27`) |
| BC-03: GET /availability returns 25 30-min slots (US02) | PASS | `generateSlots` produces 09:00–21:30; slot marked unavailable when occupied ≥ 50 (`routes/reservations.js:31–73`) |
| BC-04: Unauthenticated requests → 401 (US06) | PASS | `router.use(authenticate)` applied to all reservation routes; missing/invalid Bearer token → 401 (`src/middleware/auth.js:1–17`) |
| BC-05: POST /walkin sets status "Seated" (US08) | PASS | `requireHost` enforces host-only; status hardcoded to "Seated" (`routes/reservations.js:77–102`) |
| BC-06: PATCH /:id/status persona rules (US04) | PASS | Host can set any status; guest can only cancel own reservation, blocked on Seated (`routes/reservations.js:155–190`) |
| BC-07: Guest cannot cancel Seated reservation (US07) | PASS | Both PATCH /:id/status and DELETE /:id enforce this with 403 (`routes/reservations.js:181–183, 267–269`) |
| BC-08: 30-min lockout for guest edits (US09) | PASS | `resTime - now < 30 * 60 * 1000` → 403 "Contact Host"; host bypasses check (`routes/reservations.js:207–210`) |
| BC-09: database.json read/write (utils/db.js) | PASS | `readDb`/`writeDb` use sync fs I/O; DB path resolves correctly to project root (`src/utils/db.js:4`) |
| BC-10: GET /reservations role filtering | PASS | Host sees all; guest filtered by `r.userId === req.user.id` (`routes/reservations.js:107–113`) |

---

## Frontend Results

| Check | Status | Notes |
|-------|--------|-------|
| FC-01: LoginPage calls POST /api/auth/login (US06) | PASS | Stores token+user in localStorage via AuthContext; error shown on failure (`pages/LoginPage.tsx`) |
| FC-02: Time slot grid disables full slots (US02) | PASS | `disabled={!slot.available}` on slot buttons; fetches from GET /availability on date change (`pages/guest/BookingPage.tsx:119`) |
| FC-03: Booking validates partySize client-side (US01, US05) | PASS | Rejects <1 or >12 with error message before API call (`pages/guest/BookingPage.tsx:52–58`) |
| FC-04: Late reservation highlighting 15+ min (US03) | PASS | `isLate` checks `status === 'Confirmed'` and 15-min threshold; `table-danger` row class + StatusBadge "Late" (`pages/host/DashboardPage.tsx:11–13`) |
| FC-05: Host action buttons (Seat/Complete/Cancel) (US04) | PASS | Correct buttons shown per status; each calls PATCH /:id/status (`pages/host/DashboardPage.tsx:100–129`) |
| FC-06: ProtectedRoute role guards (US06) | PASS | No token → /login; wrong role → /login; all guest/host routes wrapped with `requiredRole` (`components/ProtectedRoute.tsx`) |
| FC-07: Cancel button disabled for Seated reservations (US07) | PASS | `canCancel = status !== 'Seated' && ...`; button `disabled={!canCancel}` (`pages/guest/MyReservationsPage.tsx:78, 107`) |
| FC-08: Edit button disabled within 30 min (US09) | **FAIL** | Lockout display works for future reservations, but **the edit page route `/guest/reservations/:id/edit` is not defined in `App.tsx`** — clicking Edit navigates to a dead route caught by the `*` wildcard, redirecting to `/`. US09 edit flow is non-functional. |
| FC-09: WalkIn form has "Instant Seat" button (US08) | PASS | Button label is "Instant Seat"; calls POST /api/reservations/walkin; guestName required enforced (`pages/host/WalkInPage.tsx:96`) |
| FC-10: Guest ReservationDetail is read-only (US04) | PASS | Only StatusBadge displayed for status; no Seat/Cancel action buttons (`pages/guest/ReservationDetailPage.tsx`) |
| FC-11: No `any` types (TypeScript hygiene) | PASS | All interfaces typed; `Reservation`, `User`, `TimeSlot` defined in `types/index.ts`; zero `any` usage observed |
| FC-12: StatusBadge correct colors per status | PASS | Confirmed=primary, Seated=success, Completed=secondary, Cancelled=danger, Late=danger (`components/StatusBadge.tsx:6–12`) |

---

## Integration Results

| Check | Status | Notes |
|-------|--------|-------|
| IC-01: Auth token in Authorization header | PASS | `authHeaders()` includes `Authorization: Bearer ${token}` from localStorage; matches middleware expectation (`api/reservations.ts:4–10`) |
| IC-02: Request body shapes match backend | PASS | All frontend API calls use `name`/`partySize`/`datetime` matching backend's `validateReservation` field names |
| IC-03: Response shapes consumed correctly | PASS | Frontend `Reservation` interface matches backend object shape; `TimeSlot` includes optional `remainingCapacity`; auth response `{ token, user }` matches |
| IC-04: API base URL constant | PASS | `export const API_BASE = 'http://localhost:3001'` in `api/config.ts` used across all API modules |
| IC-05: Frontend route paths match backend routes | PASS | All 7 endpoint paths align; `/availability` and `/walkin` are defined before `/:id` in Express router, so no shadowing |

---

## Other Checks

| Check | Status | Notes |
|-------|--------|-------|
| OC-01: .gitignore covers required paths | PASS | `node_modules/` ✓, `frontend/node_modules/` ✓, `.env` ✓, `dist` ✓ (covers both root and `frontend/dist/`), `database.json` not ignored ✓ |
| OC-02: README.md accurate and complete | PASS | All endpoints documented with auth requirements, request/response shapes, default credentials, and install instructions |
| OC-03: Non-existent reservation returns 404 | PASS | All single-resource routes check `findIndex === -1` and return 404 |

---

## Bugs Found

### Bug 1 — Major: Edit page route missing from App.tsx (US09)
- **File**: `frontend/src/App.tsx`
- **Description**: `MyReservationsPage` Edit button navigates to `/guest/reservations/:id/edit` (`pages/guest/MyReservationsPage.tsx:99`), but no such route is registered in `App.tsx`. The request falls through to the `path="*"` wildcard and redirects to `/`. Guests cannot edit any reservation through the UI.
- **Impact**: US09 acceptance criteria for guest modification is untestable via the UI. The backend `PATCH /api/reservations/:id` endpoint is correctly implemented; the issue is exclusively in frontend routing.
- **Fix**: Register a new route `<Route path="/guest/reservations/:id/edit" element={<ProtectedRoute requiredRole="guest"><EditReservationPage /></ProtectedRoute>} />` and create the corresponding `EditReservationPage` component.

### Bug 2 — Minor: `isWithin30Min` doesn't lock past reservations (US09)
- **File**: `frontend/src/pages/guest/MyReservationsPage.tsx:13–15`
- **Description**: `isWithin30Min` returns `false` when `diff < 0` (past reservations), leaving the Edit button enabled for past Confirmed reservations. The backend, however, locks edits whenever `resTime - now < 30 * 60 * 1000` (which includes all past times), so such edits would return 403 "Contact Host".
- **Impact**: UX inconsistency — button appears clickable but API call will fail.
- **Fix**: Change the condition to `diff <= 30 * 60 * 1000` (remove the `diff >= 0` lower bound) to match the backend's interpretation.

### Bug 3 — Minor: No future-date validation on reservation creation
- **File**: `src/routes/reservations.js`, `validateReservation` function (`lines 12–28`)
- **Description**: `validateReservation` accepts any parseable datetime, including dates in the past. A guest can create a reservation for yesterday.
- **Impact**: Data quality issue; no user story explicitly requires future-date enforcement, but it is a standard expectation.
- **Fix**: Add `if (Date.parse(datetime) <= Date.now()) return 'Reservation must be in the future';` in `validateReservation`.

### Bug 4 — Minor: WalkIn datetime default uses UTC, not local time
- **File**: `frontend/src/pages/host/WalkInPage.tsx:10–14`
- **Description**: `nowLocalDateTime()` calls `now.toISOString()` which returns UTC. The `datetime-local` input will therefore show UTC time, not the host's local time for users outside UTC.
- **Impact**: Walk-in entries will have incorrect datetime for non-UTC deployments.
- **Fix**: Build the datetime string from local date parts: `` `${now.getFullYear()}-${...}-${...}T${hh}:${mm}` `` instead of using `toISOString()`.

### Bug 5 — Minor: ProtectedRoute redirects wrong-role users to /login (UX)
- **File**: `frontend/src/components/ProtectedRoute.tsx:18–20`
- **Description**: When a logged-in host navigates to a guest-only route, `ProtectedRoute` redirects to `/login` instead of `/host/dashboard`. The user is already authenticated; only the role is wrong.
- **Impact**: Confusing UX — user appears to be logged out when they just navigated to the wrong area.
- **Fix**: Redirect to the user's home route based on their role rather than always to `/login`.

### Bug 6 — Trivial: Dead conditional in walk-in status assignment
- **File**: `src/routes/reservations.js:80`
- **Description**: `const status = error === 'Max Capacity Exceeded' ? 400 : 400;` — both branches produce 400. The variable is unused (the return uses the literal `400`).
- **Impact**: None (functionally correct); dead code.
- **Fix**: Remove the `status` variable; use the literal `400` directly in the response.

---

## Recommendations

1. **Implement the edit reservation page** (required to resolve Bug 1 and fully satisfy US09). The API layer already has `updateReservation()` in `api/reservations.ts`; a page component and route entry are all that's needed.
2. Add future-date validation in `validateReservation` for both POST `/reservations` and POST `/walkin` to prevent past bookings.
3. Align `isWithin30Min` with the backend's lockout logic to eliminate the inconsistency noted in Bug 2.
4. Consider replacing `toISOString()` in `nowLocalDateTime` with locale-aware date formatting for correct timezone handling in walk-in entry.
5. For production hardening: add a try/catch around `readDb()`/`writeDb()` to prevent an unhandled exception from crashing the server if `database.json` is missing or corrupted.

---

## Post-Review Fixes Applied by Team Lead (2026-04-27)

All 5 bugs (1 major, 4 minor) and the trivial dead conditional were resolved after QA review:

| Bug | Fix Applied | Files Changed |
|-----|-------------|---------------|
| Bug 1 — Missing edit route (Major) | Created `EditReservationPage.tsx` with full form, lockout guard, and PATCH call; registered `/guest/reservations/:id/edit` route in `App.tsx` | `frontend/src/pages/guest/EditReservationPage.tsx` (new), `frontend/src/App.tsx` |
| Bug 2 — `isWithin30Min` misses past dates | Removed `diff >= 0` lower bound; condition now matches backend | `frontend/src/pages/guest/MyReservationsPage.tsx:13` |
| Bug 3 — No future-date validation | Added `Date.parse(datetime) < Date.now()` guard in `validateReservation` | `src/routes/reservations.js:24` |
| Bug 4 — `nowLocalDateTime` uses UTC | Applied `getTimezoneOffset()` adjustment to produce local datetime string | `frontend/src/pages/host/WalkInPage.tsx:11` |
| Bug 5 — Wrong-role redirect to `/login` | Changed role-mismatch redirect to user's home page (`/host/dashboard` or `/guest/book`) | `frontend/src/components/ProtectedRoute.tsx:19` |
| Bug 6 — Dead conditional (Trivial) | Removed `status` variable; use literal `400` directly | `src/routes/reservations.js:80` |

**Post-fix status: 30/30 PASS**
