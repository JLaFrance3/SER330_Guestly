import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { getReservationById, updateReservation } from '../../api/reservations';
import type { Reservation } from '../../types';

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function isLocked(datetime: string): boolean {
  return new Date(datetime).getTime() - Date.now() <= 30 * 60 * 1000;
}

export default function EditReservationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    getReservationById(id)
      .then((r) => {
        setReservation(r);
        setName(r.name);
        setPartySize(r.partySize);
        setDatetime(toDateTimeLocal(r.datetime));
        setNotes(r.notes ?? '');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !reservation) return;

    if (isLocked(reservation.datetime)) {
      setError('This reservation is within 30 minutes. Contact the host to make changes.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateReservation(id, {
        name,
        partySize,
        datetime: new Date(datetime).toISOString(),
        notes,
      });
      navigate('/guest/reservations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Container className="page-container text-center pt-5">
      <Spinner animation="border" />
    </Container>
  );

  if (!reservation) return (
    <Container className="page-container">
      <Alert variant="danger">Reservation not found.</Alert>
    </Container>
  );

  const locked = isLocked(reservation.datetime);

  return (
    <Container className="page-container" style={{ maxWidth: 540 }}>
      <h1 className="page-title">Edit Reservation</h1>
      {locked && (
        <Alert variant="warning">
          This reservation is within 30 minutes. Editing is locked — contact the host.
        </Alert>
      )}
      <Card className="section-card">
        <Card.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Guest Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={locked}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="partySize">
              <Form.Label>Party Size</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={12}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                disabled={locked}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="datetime">
              <Form.Label>Date &amp; Time</Form.Label>
              <Form.Control
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                disabled={locked}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="notes">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={locked}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                className="btn-primary-custom"
                disabled={locked || submitting}
              >
                {submitting ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/guest/reservations')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
