export default function TaskItem({ task, onToggle, onDelete }) {
  const date = new Date(task.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <div>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task._id, !task.completed)}
        />
        <span style={{ textDecoration: task.completed ? 'line-through' : '', marginLeft: '8px' }}>
          {task.text}
        </span>
        <div style={{ fontSize: '0.8em', color: '#888', marginLeft: '26px' }}>
          Создано: {date}
        </div>
      </div>
      <button onClick={() => onDelete(task._id)}>Удалить</button>
    </li>
  );
}
