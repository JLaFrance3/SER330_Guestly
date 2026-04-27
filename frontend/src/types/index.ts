export interface User {
  id: string;
  username: string;
  role: 'guest' | 'host';
}

export interface Reservation {
  id: string;
  name: string;
  partySize: number;
  datetime: string;
  notes?: string;
  status: 'Confirmed' | 'Seated' | 'Completed' | 'Cancelled';
  userId: string;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  remainingCapacity?: number;
}
