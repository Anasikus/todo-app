import { useEffect, useState } from 'react';
import { fetchTaskHistory } from '../api/tasks';
import '../styles/TaskHistoryModal.css';

const fieldTranslations = {
  text: 'Название',
  labels: 'Метки',
  deadline: 'Дедлайн',
  assignedTo: 'Исполнитель',
  completed: 'Статус выполнения'
};

function formatValue(value, field) {
  if (field === 'deadline' && value) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('ru-RU');
  }

  if (field === 'labels' && Array.isArray(value)) {
    return value.join(', ');
  }

  if (field === 'assignedTo' && typeof value === 'object' && value?.name) {
    return value.name;
  }

  return String(value);
}

export default function TaskHistoryModal({ taskId, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchTaskHistory(taskId).then(setHistory);
  }, [taskId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <h3>История изменений</h3>
        <button className="close-btn" onClick={onClose}>×</button>

        {history.length === 0 ? (
          <p className="no-history">Нет истории изменений</p>
        ) : (
          <div className="table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Кто изменил</th>
                  <th>Поле</th>
                  <th>Старое значение</th>
                  <th>Новое значение</th>
                  <th>Дата и время</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => {
                  const field = fieldTranslations[entry.field] || entry.field;

                  return (
                    <tr key={entry._id}>
                      <td>{entry.user?.name || '—'}</td>
                      <td>{field || '—'}</td>
                      <td className="old">
                        {entry.oldValue !== undefined
                          ? formatValue(entry.oldValue, entry.field)
                          : '—'}
                      </td>
                      <td className="new">
                        {entry.newValue !== undefined
                          ? formatValue(entry.newValue, entry.field)
                          : '—'}
                      </td>
                      <td className="timestamp">
                        {new Date(entry.createdAt).toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
