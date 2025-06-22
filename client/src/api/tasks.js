const API_URL = 'http://localhost:4000/api/tasks';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchTasks({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await fetch(`${API_URL}?${params.toString()}`, {
    headers: getHeaders()
  });

  const data = await res.json();

  // если сервер вернул ошибку, возвращаем пустой массив
  if (!res.ok || !Array.isArray(data)) {
    console.error('Ошибка при загрузке задач:', data?.error || res.statusText);
    return []; // ← предотвращает .filter is not a function
  }

  return data;
}

export async function addTask({ text, deadline, labels, assignedTo }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, deadline, labels, assignedTo }) // именно labels!
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

export async function addComment(taskId, comment) {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment)
  });
  if (!res.ok) throw new Error('Ошибка при добавлении комментария');
  return res.json();
}
