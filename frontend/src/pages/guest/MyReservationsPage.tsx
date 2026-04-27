import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import { getMyReservations, cancelReservation } from '../../api/reservations';
import type { Reservation } from '../../types';
import StatusBadge from '../../components/StatusBadge';

function isWithin30Min(datetime: string): boolean {
  const diff = new Date(datetime).getTime() - Date.now();
  return diff <= 30 * 60 * 1000;
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError(null);
    getMyReservations()
      .then(setReservations)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      const updated = await cancelReservation(id);
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return (
    <Container className="page-container text-center pt-5">
      <Spinner animation="border" />
    </Container>
  );

  return (
    <Container className="page-container">
      <h1 className="page-title">My Reservations</h1>
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {reservations.length === 0 ? (
        <Alert variant="info">
          No reservations yet. <a href="/guest/book">Book a table</a>.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table className="reservations-table" hover>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Name</th>
                <th>Party</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const locked = isWithin30Min(r.datetime);
                const canCancel = r.status !== 'Seated' && r.status !== 'Completed' && r.status !== 'Cancelled';
                const canEdit = r.status !== 'Completed' && r.status !== 'Cancelled' && !locked;
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.datetime).toLocaleString()}</td>
                    <td>{r.name}</td>
                    <td>{r.partySize}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="d-flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => navigate(`/guest/reservations/${r.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        disabled={!canEdit}
                        title={locked ? 'Cannot edit within 30 min of reservation — contact host' : undefined}
                        onClick={() => navigate(`/guest/reservations/${r.id}/edit`)}
                      >
                        Edit
                        {locked && <Badge bg="warning" text="dark" className="ms-1">Locked</Badge>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={!canCancel || cancelling === r.id}
                        onClick={() => handleCancel(r.id)}
                      >
                        {cancelling === r.id ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}
