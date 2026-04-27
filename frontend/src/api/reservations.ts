import { API_BASE } from './config';
import type { Reservation, TimeSlot } from '../types';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.error ?? err.message ?? res.statusText);
  }
  return res.json();
}

export async function getTimeSlots(date: string): Promise<TimeSlot[]> {
  const res = await fetch(`${API_BASE}/api/reservations/availability?date=${date}`, {
    headers: authHeaders(),
  });
  return handleResponse<TimeSlot[]>(res);
}

export async function getMyReservations(): Promise<Reservation[]> {
  const res = await fetch(`${API_BASE}/api/reservations`, {
    headers: authHeaders(),
  });
  return handleResponse<Reservation[]>(res);
}

export async function getAllReservations(): Promise<Reservation[]> {
  const res = await fetch(`${API_BASE}/api/reservations`, {
    headers: authHeaders(),
  });
  return handleResponse<Reservation[]>(res);
}

export async function getReservationById(id: string): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/api/reservations/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<Reservation>(res);
}

export async function createReservation(data: {
  name: string;
  partySize: number;
  datetime: string;
  notes?: string;
}): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/api/reservations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Reservation>(res);
}

export async function updateReservationStatus(
  id: string,
  status: Reservation['status']
): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/api/reservations/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<Reservation>(res);
}

export async function updateReservation(
  id: string,
  data: Partial<Pick<Reservation, 'name' | 'partySize' | 'datetime' | 'notes'>>
): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/api/reservations/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Reservation>(res);
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/api/reservations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<Reservation>(res);
}

export async function createWalkIn(data: {
  name: string;
  partySize: number;
  datetime: string;
}): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/api/reservations/walkin`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<Reservation>(res);
}
