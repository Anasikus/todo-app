import { getHeaders } from './helpers';

export async function fetchNotifications() {
  const res = await fetch('http://localhost:4000/api/notifications', {
    headers: getHeaders(),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function markNotificationAsRead(id) {
  return fetch(`http://localhost:4000/api/notifications/${id}/read`, {
    method: 'POST',
    headers: getHeaders(),
  });
}

export async function clearNotifications() {
  return fetch('http://localhost:4000/api/notifications/clear', {
    method: 'DELETE',
    headers: getHeaders(),
  });
}
