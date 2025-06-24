import '../styles/TaskHistoryModal.css';
import { useEffect, useState } from 'react';

export default function TaskHistoryModal({ taskId, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!taskId) return;

    fetch(`http://localhost:4000/api/tasks/${taskId}/history`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(setHistory)
      .catch(err => console.error('Ошибка загрузки истории:', err));
  }, [taskId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>История изменений</h3>
        {history.length === 0 ? (
          <p>Нет изменений</p>
        ) : (
          <ul className="history-list">
            {history.map(item => (
              <li key={item._id}>
                <strong>{item.changedBy?.name || 'Неизвестно'}</strong> изменил поле <strong>{item.field}</strong><br />
                <em>с:</em> {item.oldValue || '(пусто)'} <br />
                <em>на:</em> {item.newValue || '(пусто)'} <br />
                <span className="timestamp">
                  {new Date(item.createdAt).toLocaleString('ru-RU')}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose} className="close-btn">Закрыть</button>
      </div>
    </div>
  );
}
