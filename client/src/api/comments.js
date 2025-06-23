import { getHeaders } from './helpers';

const API = 'http://localhost:4000/api/tasks';

export async function fetchComments(taskId) {
  const res = await fetch(`${API}/${taskId}/comments`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Не удалось загрузить комментарии');
  return res.json();
}

export async function addComment(taskId, comment) {
  const isFormData = comment instanceof FormData;

  const headers = isFormData
    ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
    : {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      };

  const res = await fetch(`${API}/${taskId}/comments`, {
    method: 'POST',
    headers,
    body: isFormData ? comment : JSON.stringify(comment)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка при добавлении');
  }

  return res.json();
}

export async function editComment(taskId, commentId, text) {
  const res = await fetch(`${API}/${taskId}/comments/${commentId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(text)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка при обновлении');
  }

  return res.json();
}

export async function deleteComment(taskId, commentId) {
  const res = await fetch(`${API}/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Ошибка при удалении');
}
