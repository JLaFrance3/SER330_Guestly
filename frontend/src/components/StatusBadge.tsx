import Badge from 'react-bootstrap/Badge';
import type { Reservation } from '../types';

type Status = Reservation['status'] | 'Late';

const variantMap: Record<Status, string> = {
  Confirmed: 'primary',
  Seated: 'success',
  Completed: 'secondary',
  Cancelled: 'danger',
  Late: 'danger',
};

export default function StatusBadge({ status }: { status: Status }) {
  return <Badge bg={variantMap[status]}>{status}</Badge>;
}
