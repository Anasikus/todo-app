const API = 'http://localhost:4000/api/invites';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  };
}

export async function sendInvite(email) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка при отправке');
  return data;
}

export async function fetchMyInvites() {
  const res = await fetch(`${API}/my`, {
    method: 'GET',
    headers: getHeaders()
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Ошибка при получении приглашений');
  }

  return await res.json();
}

export async function acceptInvite(id) {
  const res = await fetch(`${API}/accept/${id}`, {
    method: 'POST',
    headers: getHeaders()
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка при принятии приглашения');
  return data;
}

export async function declineInvite(id) {
  const res = await fetch(`${API}/decline/${id}`, {
    method: 'POST',
    headers: getHeaders()
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка при отклонении приглашения');
  return data;
}
