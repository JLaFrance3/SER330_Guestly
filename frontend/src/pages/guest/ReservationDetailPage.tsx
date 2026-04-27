import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { getReservationById } from '../../api/reservations';
import type { Reservation } from '../../types';
import StatusBadge from '../../components/StatusBadge';

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getReservationById(id)
      .then(setReservation)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Container className="page-container text-center pt-5"><Spinner animation="border" /></Container>
  );

  return (
    <Container className="page-container" style={{ maxWidth: 520 }}>
      <h1 className="page-title">Reservation Details</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {reservation && (
        <Card className="section-card">
          <Card.Body>
            <dl className="detail-list">
              <dt>Guest Name</dt>
              <dd>{reservation.name}</dd>
              <dt>Date &amp; Time</dt>
              <dd>{new Date(reservation.datetime).toLocaleString()}</dd>
              <dt>Party Size</dt>
              <dd>{reservation.partySize}</dd>
              <dt>Status</dt>
              <dd><StatusBadge status={reservation.status} /></dd>
              {reservation.notes && (
                <>
                  <dt>Notes</dt>
                  <dd>{reservation.notes}</dd>
                </>
              )}
              <dt>Booked At</dt>
              <dd>{new Date(reservation.createdAt).toLocaleString()}</dd>
            </dl>
          </Card.Body>
        </Card>
      )}
      <Button variant="outline-secondary" className="mt-3" onClick={() => navigate(-1)}>
        Back
      </Button>
    </Container>
  );
}
