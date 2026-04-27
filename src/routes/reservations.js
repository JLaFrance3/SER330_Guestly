const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');
const { authenticate, requireHost } = require('../middleware/auth');

// All reservation routes require authentication (US06)
router.use(authenticate);

// --- Helpers ---

function validateReservation(body) {
  const { name, partySize, datetime } = body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return 'Guest name is required';
  }
  const size = Number(partySize);
  if (!partySize || isNaN(size) || size < 1) {
    return 'Party size must be at least 1';
  }
  if (size > 12) {
    return 'Max Capacity Exceeded';
  }
  if (!datetime || isNaN(Date.parse(datetime))) {
    return 'Valid datetime is required';
  }
  if (new Date(datetime).getTime() < Date.now()) {
    return 'Reservation must be in the future';
  }
  return null;
}

// Generate 30-min slots for a date (09:00–21:30)
function generateSlots(date) {
  const slots = [];
  for (let h = 9; h < 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 21 && m === 30) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${date}T${hh}:${mm}:00`);
    }
  }
  return slots;
}

// GET /api/reservations/availability?date=YYYY-MM-DD — US02
router.get('/availability', (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
  }

  const db = readDb();
  const slots = generateSlots(date);

  const result = slots.map((slotStart) => {
    const start = new Date(slotStart).getTime();
    const end = start + 30 * 60 * 1000;

    const occupied = db.reservations
      .filter((r) => {
        if (r.status !== 'Confirmed' && r.status !== 'Seated') return false;
        const t = new Date(r.datetime).getTime();
        return t >= start && t < end;
      })
      .reduce((sum, r) => sum + r.partySize, 0);

    return {
      time: slotStart,
      available: occupied < 50,
      remainingCapacity: Math.max(0, 50 - occupied),
    };
  });

  res.json(result);
});

// POST /api/reservations/walkin — US08 (host only)
router.post('/walkin', requireHost, (req, res) => {
  const error = validateReservation(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { name, partySize, datetime, notes } = req.body;
  const db = readDb();

  const reservation = {
    id: uuidv4(),
    name: name.trim(),
    partySize: Number(partySize),
    datetime,
    notes: notes || '',
    status: 'Seated',
    userId: req.user.id,
    createdAt: new Date().toISOString(),
  };

  db.reservations.push(reservation);
  writeDb(db);

  res.status(201).json(reservation);
});

// GET /api/reservations — US03 (host: all; guest: own)
router.get('/', (req, res) => {
  const db = readDb();
  const reservations =
    req.user.role === 'host'
      ? db.reservations
      : db.reservations.filter((r) => r.userId === req.user.id);

  res.json(reservations);
});

// POST /api/reservations — US01
router.post('/', (req, res) => {
  const error = validateReservation(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { name, partySize, datetime, notes } = req.body;
  const db = readDb();

  const reservation = {
    id: uuidv4(),
    name: name.trim(),
    partySize: Number(partySize),
    datetime,
    notes: notes || '',
    status: 'Confirmed',
    userId: req.user.id,
    createdAt: new Date().toISOString(),
  };

  db.reservations.push(reservation);
  writeDb(db);

  res.status(201).json(reservation);
});

// GET /api/reservations/:id
router.get('/:id', (req, res) => {
  const db = readDb();
  const reservation = db.reservations.find((r) => r.id === req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  if (req.user.role !== 'host' && reservation.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(reservation);
});

// PATCH /api/reservations/:id/status — US04, US07
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Confirmed', 'Seated', 'Completed', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const db = readDb();
  const idx = db.reservations.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const reservation = db.reservations[idx];

  if (req.user.role !== 'host') {
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Guests can only cancel (US07)
    if (status !== 'Cancelled') {
      return res.status(403).json({ error: 'Guests can only cancel reservations' });
    }
    // Guest cannot cancel a Seated reservation (US07)
    if (reservation.status === 'Seated') {
      return res.status(403).json({ error: 'Cannot cancel a reservation that is already Seated' });
    }
  }

  db.reservations[idx] = { ...reservation, status };
  writeDb(db);

  res.json(db.reservations[idx]);
});

// PATCH /api/reservations/:id — US09 (edit details)
router.patch('/:id', (req, res) => {
  const db = readDb();
  const idx = db.reservations.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const reservation = db.reservations[idx];

  if (req.user.role !== 'host') {
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // 30-minute lockout (US09)
    const resTime = new Date(reservation.datetime).getTime();
    const now = Date.now();
    if (resTime - now < 30 * 60 * 1000) {
      return res.status(403).json({ error: 'Contact Host' });
    }
  }

  const { name, partySize, datetime, notes } = req.body;
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Guest name is required' });
    }
    updates.name = name.trim();
  }

  if (partySize !== undefined) {
    const size = Number(partySize);
    if (isNaN(size) || size < 1) {
      return res.status(400).json({ error: 'Party size must be at least 1' });
    }
    if (size > 12) {
      return res.status(400).json({ error: 'Max Capacity Exceeded' });
    }
    updates.partySize = size;
  }

  if (datetime !== undefined) {
    if (isNaN(Date.parse(datetime))) {
      return res.status(400).json({ error: 'Valid datetime is required' });
    }
    updates.datetime = datetime;
  }

  if (notes !== undefined) {
    updates.notes = notes;
  }

  db.reservations[idx] = { ...reservation, ...updates };
  writeDb(db);

  res.json(db.reservations[idx]);
});

// DELETE /api/reservations/:id — US07
router.delete('/:id', (req, res) => {
  const db = readDb();
  const idx = db.reservations.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const reservation = db.reservations[idx];

  if (req.user.role !== 'host') {
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Guest cannot cancel a Seated reservation (US07)
    if (reservation.status === 'Seated') {
      return res.status(403).json({ error: 'Cannot cancel a reservation that is already Seated' });
    }
  }

  db.reservations[idx] = { ...reservation, status: 'Cancelled' };
  writeDb(db);

  res.json(db.reservations[idx]);
});

module.exports = router;
