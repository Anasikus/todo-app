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


export async function addTask(text) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text })
  });
  return await res.json();
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
