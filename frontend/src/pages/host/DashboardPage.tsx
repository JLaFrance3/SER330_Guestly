import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { getAllReservations, updateReservationStatus } from '../../api/reservations';
import type { Reservation } from '../../types';
import StatusBadge from '../../components/StatusBadge';

function isLate(r: Reservation): boolean {
  if (r.status !== 'Confirmed') return false;
  return Date.now() - new Date(r.datetime).getTime() > 15 * 60 * 1000;
}

function isToday(datetime: string): boolean {
  const d = new Date(datetime);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getAllReservations()
      .then((all) =>
        setReservations(
          all
            .filter((r) => isToday(r.datetime))
            .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
        )
      )
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: Reservation['status']) => {
    setUpdating(id);
    try {
      const updated = await updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <Container className="page-container text-center pt-5"><Spinner animation="border" /></Container>
  );

  return (
    <Container className="page-container" fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title mb-0">Today's Dashboard</h1>
        <Button variant="outline-secondary" size="sm" onClick={load}>Refresh</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {reservations.length === 0 ? (
        <Alert variant="info">No reservations today.</Alert>
      ) : (
        <div className="table-responsive">
          <Table className="reservations-table" hover>
            <thead>
              <tr>
                <th>Time</th>
                <th>Guest</th>
                <th>Party</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const late = isLate(r);
                return (
                  <tr key={r.id} className={late ? 'table-danger' : undefined}>
                    <td>{new Date(r.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{r.name}</td>
                    <td>{r.partySize}</td>
                    <td>
                      {late ? <StatusBadge status="Late" /> : <StatusBadge status={r.status} />}
                    </td>
                    <td className="d-flex gap-2 flex-wrap">
                      {r.status === 'Confirmed' && (
                        <Button
                          size="sm"
                          variant="success"
                          disabled={updating === r.id}
                          onClick={() => handleStatus(r.id, 'Seated')}
                        >
                          Seat Party
                        </Button>
                      )}
                      {r.status === 'Seated' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={updating === r.id}
                          onClick={() => handleStatus(r.id, 'Completed')}
                        >
                          Complete
                        </Button>
                      )}
                      {(r.status === 'Confirmed' || r.status === 'Seated') && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={updating === r.id}
                          onClick={() => handleStatus(r.id, 'Cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
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
