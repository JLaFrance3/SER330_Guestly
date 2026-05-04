/* eslint-disable no-undef */
/**
 * Automated API tests — TC01, TC03, TC04, TC06, TC07, TC09, TC10, TC11
 * Uses Supertest against the Express app directly (no live server needed).
 * database.json is restored after each test to prevent state bleed.
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/server');

const DB_PATH = path.join(__dirname, '../database.json');

// ── Token helpers ────────────────────────────────────────────────────────────

function makeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

const GUEST_TOKEN = makeToken({ id: 'guest-001', username: 'alice', role: 'guest' });
const HOST_TOKEN = makeToken({ id: 'host-001', username: 'host', role: 'host' });

// Far-future datetime so "must be in the future" validation always passes
const FUTURE = '2027-06-15T19:00:00.000Z';

// ── DB isolation ─────────────────────────────────────────────────────────────

let snapshot;

beforeAll(() => {
  snapshot = fs.readFileSync(DB_PATH, 'utf8');
});

afterEach(() => {
  fs.writeFileSync(DB_PATH, snapshot, 'utf8');
});

function seedReservation(overrides) {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const record = {
    id: 'test-res-seed',
    name: 'Seed Guest',
    partySize: 2,
    datetime: FUTURE,
    notes: '',
    status: 'Confirmed',
    userId: 'guest-001',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  db.reservations.push(record);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  return record;
}

// ── TC01 — Functional: guest books a reservation ─────────────────────────────

test('TC01 – POST /api/reservations returns 201 and persists the record', async () => {
  const res = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${GUEST_TOKEN}`)
    .send({ name: 'Alice Smith', partySize: 4, datetime: FUTURE });

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({ name: 'Alice Smith', partySize: 4, status: 'Confirmed' });
  expect(res.body.id).toBeTruthy();

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  expect(db.reservations.some((r) => r.id === res.body.id)).toBe(true);
});

// ── TC03 — Functional: host seats a confirmed reservation ────────────────────

test('TC03 – PATCH /:id/status to Seated succeeds for host and updates DB', async () => {
  const { id } = seedReservation({
    id: 'R-001',
    name: 'Bob Jones',
    partySize: 3,
    status: 'Confirmed',
  });

  const res = await request(app)
    .patch(`/api/reservations/${id}/status`)
    .set('Authorization', `Bearer ${HOST_TOKEN}`)
    .send({ status: 'Seated' });

  expect(res.status).toBe(200);
  expect(res.body.status).toBe('Seated');

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  expect(db.reservations.find((r) => r.id === id).status).toBe('Seated');
});

// ── TC04 — Functional: guest cancels own confirmed reservation ───────────────

test('TC04 – guest PATCH /:id/status to Cancelled returns 200', async () => {
  const { id } = seedReservation({ id: 'R-002', status: 'Confirmed', userId: 'guest-001' });

  const res = await request(app)
    .patch(`/api/reservations/${id}/status`)
    .set('Authorization', `Bearer ${GUEST_TOKEN}`)
    .send({ status: 'Cancelled' });

  expect(res.status).toBe(200);
  expect(res.body.status).toBe('Cancelled');
});

// ── TC06 — Negative: party size 0 is rejected ────────────────────────────────

test('TC06 – POST with partySize 0 returns 400 and writes nothing to DB', async () => {
  const before = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')).reservations.length;

  const res = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${GUEST_TOKEN}`)
    .send({ name: 'Test User', partySize: 0, datetime: FUTURE });

  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/party size must be at least 1/i);

  const after = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')).reservations.length;
  expect(after).toBe(before);
});

// ── TC07 — Negative: request with no auth header is rejected ─────────────────

test('TC07 – PATCH /:id/status without Authorization header returns 401', async () => {
  const res = await request(app).patch('/api/reservations/R-001/status').send({ status: 'Seated' });

  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Unauthorized');
});

// ── TC09 — Negative: guest cannot cancel a Seated reservation ────────────────

test('TC09 – guest PATCH to cancel a Seated reservation returns 403', async () => {
  const { id } = seedReservation({ id: 'R-003', status: 'Seated', userId: 'guest-001' });

  const res = await request(app)
    .patch(`/api/reservations/${id}/status`)
    .set('Authorization', `Bearer ${GUEST_TOKEN}`)
    .send({ status: 'Cancelled' });

  expect(res.status).toBe(403);
});

// ── TC10 — Boundary: party size 12 (maximum) is accepted ─────────────────────

test('TC10 – POST with partySize 12 returns 201 with correct party size', async () => {
  const res = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${GUEST_TOKEN}`)
    .send({ name: 'Large Party', partySize: 12, datetime: FUTURE });

  expect(res.status).toBe(201);
  expect(res.body.partySize).toBe(12);
});

// ── TC11 — Boundary: party size 13 (one over maximum) is rejected ────────────

test('TC11 – POST with partySize 13 returns 400 Max Capacity Exceeded', async () => {
  const res = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${GUEST_TOKEN}`)
    .send({ name: 'Overflow Party', partySize: 13, datetime: FUTURE });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Max Capacity Exceeded');
});
