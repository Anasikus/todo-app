const API_URL = 'http://localhost:4000/api/team';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchMyTeam() {
  const res = await fetch(`http://localhost:4000/api/team/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (res.status === 404) {
    return null; // пользователь не в команде — это нормально
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Ошибка при получении команды');
  }

  return await res.json();
}

export async function createTeam(name) {
  const res = await fetch(`http://localhost:4000/api/team/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ name })
  });
  return await res.json();
}

export async function setTeamOwner(userId) {
  const res = await fetch(`${API_URL}/set-owner`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка при обновлении владельца');

  return data;
}

export async function fetchAvailableTeams() {
  const res = await fetch(`http://localhost:4000/api/team/available`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Ошибка при получении доступных команд');
  }

  return await res.json();
}
