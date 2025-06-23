import { getHeaders } from './helpers';

const API_URL = 'http://localhost:4000/api/tasks';

export async function fetchTasks({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await fetch(`${API_URL}?${params.toString()}`, {
    headers: getHeaders()
  });

  const data = await res.json();

  if (!res.ok || !Array.isArray(data)) {
    console.error('Ошибка при загрузке задач:', data?.error || res.statusText);
    return [];
  }

  return data;
}

export async function addTask({ text, deadline, labels, assignedTo }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, deadline, labels, assignedTo })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка при создании задачи');
  return data;
}

export async function deleteTask(id) {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
}

export async function updateTask(id, updates) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  return await res.json();
}
