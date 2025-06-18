const API_URL = 'http://localhost:4000/api/tasks';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchTasks() {
  const res = await fetch(API_URL, { headers: getHeaders() });
  return await res.json();
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
