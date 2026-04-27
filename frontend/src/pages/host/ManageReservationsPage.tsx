import { useState, useEffect, useMemo } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { getAllReservations, updateReservationStatus } from '../../api/reservations';
import type { Reservation } from '../../types';
import StatusBadge from '../../components/StatusBadge';

type SortKey = 'datetime' | 'name' | 'partySize';
type StatusFilter = Reservation['status'] | 'All';

export default function ManageReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('datetime');

  const load = () => {
    setLoading(true);
    setError(null);
    getAllReservations()
      .then(setReservations)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const displayed = useMemo(() => {
    let list = statusFilter === 'All'
      ? reservations
      : reservations.filter((r) => r.status === statusFilter);
    list = [...list].sort((a, b) => {
      if (sortKey === 'datetime') return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      if (sortKey === 'partySize') return a.partySize - b.partySize;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [reservations, statusFilter, sortKey]);

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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="page-title mb-0">All Reservations</h1>
        <Button variant="outline-secondary" size="sm" onClick={load}>Refresh</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      <Row className="mb-3 g-2">
        <Col xs={12} sm={4}>
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Seated">Seated</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Form.Select>
        </Col>
        <Col xs={12} sm={4}>
          <Form.Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="datetime">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="partySize">Sort by Party Size</option>
          </Form.Select>
        </Col>
      </Row>

      {displayed.length === 0 ? (
        <Alert variant="info">No reservations match the filter.</Alert>
      ) : (
        <div className="table-responsive">
          <Table className="reservations-table" hover>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Guest</th>
                <th>Party</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.datetime).toLocaleString()}</td>
                  <td>{r.name}</td>
                  <td>{r.partySize}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="d-flex gap-2 flex-wrap">
                    {r.status === 'Confirmed' && (
                      <Button size="sm" variant="success" disabled={updating === r.id}
                        onClick={() => handleStatus(r.id, 'Seated')}>
                        Seat Party
                      </Button>
                    )}
                    {r.status === 'Seated' && (
                      <Button size="sm" variant="secondary" disabled={updating === r.id}
                        onClick={() => handleStatus(r.id, 'Completed')}>
                        Complete
                      </Button>
                    )}
                    {(r.status === 'Confirmed' || r.status === 'Seated') && (
                      <Button size="sm" variant="outline-danger" disabled={updating === r.id}
                        onClick={() => handleStatus(r.id, 'Cancelled')}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}
