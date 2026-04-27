import { useState } from 'react';
import type { FormEvent } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { createWalkIn } from '../../api/reservations';

function nowLocalDateTime(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export default function WalkInPage() {
  const [guestName, setGuestName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [dateTime, setDateTime] = useState(nowLocalDateTime());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Guest name is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createWalkIn({
        name: guestName.trim(),
        partySize,
        datetime: new Date(dateTime).toISOString(),
      });
      setSuccess(true);
      setGuestName('');
      setPartySize(2);
      setDateTime(nowLocalDateTime());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Walk-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="page-container" style={{ maxWidth: 540 }}>
      <h1 className="page-title">Walk-In Entry</h1>
      {success && (
        <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
          Walk-in seated successfully!
        </Alert>
      )}
      <Card className="section-card">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="guestName">
              <Form.Label>Guest Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                isInvalid={error?.includes('Guest name') ?? false}
              />
              <Form.Control.Feedback type="invalid">Guest name is required.</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="partySize">
              <Form.Label>Party Size</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={12}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="dateTime">
              <Form.Label>Date &amp; Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="btn-primary-custom w-100" disabled={submitting}>
              {submitting ? 'Seating…' : 'Instant Seat'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
