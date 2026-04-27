import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { getTimeSlots, createReservation } from '../../api/reservations';
import type { TimeSlot } from '../../types';

const MAX_PARTY = 12;

function toLocalDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatSlotTime(isoTime: string): string {
  const d = new Date(isoTime);
  if (isNaN(d.getTime())) return isoTime;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function BookingPage() {
  const today = toLocalDateString(new Date());
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedSlot(null);
    setLoadingSlots(true);
    setSlotsError(null);
    getTimeSlots(date)
      .then(setSlots)
      .catch((err: Error) => setSlotsError(err.message))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (partySize < 1) {
      setSubmitError('Party size must be at least 1.');
      return;
    }
    if (partySize > MAX_PARTY) {
      setSubmitError(`Max Capacity Exceeded — parties larger than ${MAX_PARTY} must call the restaurant.`);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createReservation({
        name: guestName,
        partySize,
        datetime: selectedSlot.time,
      });
      setSuccess(true);
      setSelectedSlot(null);
      setGuestName('');
      setPartySize(2);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="page-container">
      <h1 className="page-title">Book a Table</h1>

      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
          Reservation confirmed! You can view it in My Reservations.
        </Alert>
      )}

      <Card className="section-card mb-4">
        <Card.Body>
          <Form.Group controlId="date" className="mb-3">
            <Form.Label className="fw-semibold">Select Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </Form.Group>

          {loadingSlots && (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" /> Loading availability…
            </div>
          )}

          {slotsError && <Alert variant="warning">{slotsError}</Alert>}

          {!loadingSlots && slots.length > 0 && (
            <>
              <p className="fw-semibold mb-2">Available Times</p>
              <Row className="g-2 mb-2">
                {slots.map((slot) => (
                  <Col xs={6} sm={4} md={3} key={slot.time}>
                    <Button
                      variant={selectedSlot?.time === slot.time ? 'primary' : 'outline-secondary'}
                      className={`w-100 slot-btn${!slot.available ? ' slot-btn--disabled' : ''}`}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatSlotTime(slot.time)}
                    </Button>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Card.Body>
      </Card>

      {selectedSlot && (
        <Card className="section-card">
          <Card.Body>
            <h5 className="mb-3">Reservation Details — {formatSlotTime(selectedSlot.time)} on {date}</h5>
            {submitError && <Alert variant="danger">{submitError}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="guestName">
                <Form.Label>Your Name</Form.Label>
                <Form.Control
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="partySize">
                <Form.Label>Party Size</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  max={MAX_PARTY}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  required
                  isInvalid={partySize < 1 || partySize > MAX_PARTY}
                />
                <Form.Control.Feedback type="invalid">
                  {partySize < 1
                    ? 'Party size must be at least 1.'
                    : `Max Capacity Exceeded — call the restaurant for parties over ${MAX_PARTY}.`}
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" className="btn-primary-custom" disabled={submitting}>
                {submitting ? 'Booking…' : 'Book Table'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
