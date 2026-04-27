# Guestly Test Plan
Date: 2026-04-27
Reviewer: QA Agent

## Overview
This test plan covers all 9 user stories (US01–US09) for the Guestly restaurant reservation app.
Each check maps to specific acceptance criteria in docs/ProductBacklog.csv.

---

## User Story Reference

| Story | Title | Key Acceptance Criteria |
|-------|-------|------------------------|
| US01 | Create Reservation | Valid submission saves record; party size 0/negative returns error |
| US02 | View Table Availability | Available 30-min slots shown; full slots greyed/unclickable |
| US03 | Host Dashboard Overview | Reservations 15+ min late highlighted red with "Late" flag |
| US04 | Update Reservation Status | Host sees Seat/Cancel buttons; Guest sees read-only status |
| US05 | Capacity Boundary Constraint | Party size 12 accepted; party size 13 returns "Max Capacity Exceeded" |
| US06 | Secure Login/Session | Host token unlocks management endpoints; unauthenticated → 401 |
| US07 | Cancel Reservation | Guest can cancel unless "Seated"; Host can always cancel |
| US08 | Host Manual Entry | Walk-in saves with status "Seated"; blank name field blocked |
| US09 | Modification Lockout | Guest cannot edit within 30 min of reservation; blocked with "Contact Host" |

---

## Backend Checks

### BC-01: POST /api/reservations — partySize validation (US01, US05)
- **What to verify**: Submitting partySize=0 returns 400 error
- **What to verify**: Submitting partySize=-1 returns 400 error
- **What to verify**: Submitting partySize=13 returns 400 with "Max Capacity Exceeded"
- **What to verify**: Submitting partySize=12 returns 201 success
- **What to verify**: Submitting partySize=1 returns 201 success
- **File**: `routes/reservations.js`

### BC-02: POST /api/reservations — required fields (US01, US08)
- **What to verify**: Missing `guestName` returns 400
- **What to verify**: Missing `dateTime` returns 400
- **What to verify**: Valid submission saves record with status "Confirmed", uuid id, and createdAt timestamp
- **File**: `routes/reservations.js`

### BC-03: GET /api/reservations/availability (US02)
- **What to verify**: Returns 30-minute time slots for a given date
- **What to verify**: A slot where total confirmed/seated party sizes >= 50 is marked `available: false`
- **What to verify**: A slot with room available is marked `available: true`
- **File**: `routes/reservations.js`

### BC-04: Host-only routes reject unauthorized access (US06)
- **What to verify**: POST /api/reservations/walkin without token returns 401
- **What to verify**: PATCH /api/reservations/:id/status without token returns 401
- **What to verify**: GET /api/reservations without token returns 401
- **What to verify**: Guest token on host-only route returns 403
- **File**: `middleware/auth.js`, `routes/reservations.js`

### BC-05: POST /api/reservations/walkin — walk-in entry (US08)
- **What to verify**: Creates reservation with status "Seated" immediately (not "Confirmed")
- **What to verify**: Missing guestName returns 400
- **What to verify**: Host-only — guest token returns 403
- **File**: `routes/reservations.js`

### BC-06: PATCH /api/reservations/:id/status — persona rules (US04, US07)
- **What to verify**: Host can set status to "Seated", "Completed", "Cancelled"
- **What to verify**: Guest CANNOT use this endpoint (403)
- **File**: `routes/reservations.js`, `middleware/auth.js`

### BC-07: Guest cancel rules (US07)
- **What to verify**: Guest can cancel a "Confirmed" reservation
- **What to verify**: Guest attempting to cancel a "Seated" reservation returns 403
- **What to verify**: Host can cancel a "Seated" reservation
- **File**: `routes/reservations.js`

### BC-08: 30-minute lockout for guest edits (US09)
- **What to verify**: PATCH /api/reservations/:id blocks guest if reservation is within 30 min
- **What to verify**: Returns 403 with "Contact Host" message
- **What to verify**: Host is NOT subject to this lockout (can always edit)
- **What to verify**: Guest CAN edit if reservation is more than 30 min away
- **File**: `routes/reservations.js`

### BC-09: database.json read/write (utils/db.js)
- **What to verify**: `readDb()` returns parsed JSON from database.json
- **What to verify**: `writeDb()` persists changes to database.json
- **What to verify**: Initial database.json has empty reservations array and 3 seed users
- **File**: `utils/db.js`, `database.json`

### BC-10: GET /api/reservations — role filtering
- **What to verify**: Host sees all reservations
- **What to verify**: Guest sees only their own reservations (filtered by userId)
- **File**: `routes/reservations.js`

---

## Frontend Checks

### FC-01: LoginPage — auth flow (US06)
- **What to verify**: Calls POST /api/auth/login with username and password
- **What to verify**: Stores token and role in localStorage on success
- **What to verify**: Invalid credentials show error message
- **File**: `frontend/src/pages/LoginPage.tsx`

### FC-02: BookingPage — time slot grid (US02)
- **What to verify**: Calls GET /api/reservations/availability?date=... to fetch slots
- **What to verify**: Full slots (available: false) are greyed out and unclickable/disabled
- **What to verify**: Available slots are selectable
- **File**: `frontend/src/pages/BookingPage.tsx`

### FC-03: BookingPage — reservation creation (US01)
- **What to verify**: Calls POST /api/reservations with guestName, partySize, dateTime
- **What to verify**: Shows validation error for invalid partySize (0, negative, >12)
- **What to verify**: Success redirects or confirms booking
- **File**: `frontend/src/pages/BookingPage.tsx`

### FC-04: DashboardPage — late reservation highlighting (US03)
- **What to verify**: Reservations where current time > reservationTime + 15 min AND status != "Seated"/"Completed"/"Cancelled" are highlighted in red
- **What to verify**: "Late" badge appears on those reservations
- **File**: `frontend/src/pages/DashboardPage.tsx`

### FC-05: DashboardPage — host action buttons (US04)
- **What to verify**: Host sees "Seat Party", "Complete", "Cancel" buttons
- **What to verify**: Clicking "Seat Party" calls PATCH /api/reservations/:id/status with { status: "Seated" }
- **File**: `frontend/src/pages/DashboardPage.tsx`

### FC-06: ProtectedRoute — role guards (US06)
- **What to verify**: Unauthenticated users redirected to /login
- **What to verify**: Guest cannot access /host/* routes (redirected)
- **What to verify**: Host cannot access /guest/* routes (or is redirected)
- **File**: `frontend/src/components/ProtectedRoute.tsx`

### FC-07: MyReservationsPage — cancel button rules (US07)
- **What to verify**: Cancel button is present for "Confirmed" reservations
- **What to verify**: Cancel button is DISABLED or hidden for "Seated" reservations (guest view)
- **What to verify**: Calls DELETE /api/reservations/:id or PATCH with Cancelled status on cancel
- **File**: `frontend/src/pages/MyReservationsPage.tsx`

### FC-08: MyReservationsPage — edit lockout (US09)
- **What to verify**: Edit button is DISABLED within 30 min of reservation time
- **What to verify**: Edit button is enabled when reservation is > 30 min away
- **File**: `frontend/src/pages/MyReservationsPage.tsx`

### FC-09: WalkInPage — instant seat (US08)
- **What to verify**: Has an "Instant Seat" submit button
- **What to verify**: Calls POST /api/reservations/walkin
- **What to verify**: guestName field is required (shown as required)
- **File**: `frontend/src/pages/WalkInPage.tsx`

### FC-10: ReservationDetailPage — guest read-only (US04)
- **What to verify**: Guest sees status as read-only label, no action buttons
- **File**: `frontend/src/pages/ReservationDetailPage.tsx`

### FC-11: TypeScript type hygiene
- **What to verify**: No unwarranted `any` types in components or pages
- **What to verify**: Reservation, User, TimeSlot interfaces match data shapes from backend
- **Files**: `frontend/src/types/` or inline interfaces in components

### FC-12: StatusBadge — correct colors per status
- **What to verify**: Confirmed=blue, Seated=green, Completed=grey, Cancelled=red, Late=red
- **File**: `frontend/src/components/StatusBadge.tsx`

---

## Integration Checks

### IC-01: Auth token propagation
- **What to verify**: All API calls that require auth include `Authorization: Bearer <token>` header
- **What to verify**: Token format matches what backend's middleware/auth.js expects

### IC-02: Request body shapes
- **What to verify**: POST /api/reservations body matches backend's expected fields (guestName, partySize, dateTime)
- **What to verify**: POST /api/reservations/walkin body matches backend's expected fields
- **What to verify**: PATCH /api/reservations/:id/status body has { status: "..." }

### IC-03: Response shape consumption
- **What to verify**: Frontend correctly reads reservation fields (id, guestName, partySize, dateTime, status, userId, createdAt)
- **What to verify**: Frontend correctly reads availability response (array of TimeSlot objects with time and available)
- **What to verify**: Frontend correctly reads auth response ({ token, user })

### IC-04: API base URL consistency
- **What to verify**: Frontend uses `http://localhost:3001` as base URL
- **What to verify**: Defined as a constant in `src/api/config.ts`

### IC-05: Route path alignment
- **What to verify**: Frontend route paths match backend-defined Express routes
- **Specifically**: /api/reservations, /api/reservations/availability, /api/reservations/walkin, /api/reservations/:id/status, /api/auth/login

---

## Other Checks

### OC-01: .gitignore completeness
- **What to verify**: `node_modules/` is ignored
- **What to verify**: `frontend/node_modules/` is ignored
- **What to verify**: `.env` is ignored
- **What to verify**: `dist/` is ignored
- **What to verify**: `frontend/dist/` is ignored
- **What to verify**: `database.json` is NOT ignored (needed for app)

### OC-02: README.md accuracy
- **What to verify**: All 7 API endpoints documented (login, list, create, availability, walkin, get one, patch status, patch details, delete)
- **What to verify**: Auth requirements noted per endpoint
- **What to verify**: Request body shapes documented
- **What to verify**: Default credentials listed (host/host123, alice/alice123, bob/bob123)
- **What to verify**: Install and run instructions present

### OC-03: Edge cases and error handling
- **What to verify**: Non-existent reservation ID returns 404
- **What to verify**: Invalid/expired token returns 401
- **What to verify**: All frontend API calls have loading and error states

---

## Test Execution Order
1. Backend unit-level checks (BC-01 through BC-10) — review routes/reservations.js, middleware/auth.js, utils/db.js
2. Frontend component checks (FC-01 through FC-12) — review all pages and components
3. Integration checks (IC-01 through IC-05) — cross-reference frontend calls against backend signatures
4. Other checks (OC-01 through OC-03) — .gitignore, README.md, edge cases
