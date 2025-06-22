import { useState, useEffect } from 'react';
import { fetchMyTeam } from '../api/team';
import { fetchTasks, addTask, deleteTask, updateTask } from '../api/tasks';
import '../styles/main.css';

export default function TaskPage({ user: propUser }) {
  const [user, setUser] = useState(propUser || null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [text, setText] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const isOwner = team?.owner === user?.id || team?.owner === user?._id;

  useEffect(() => {
    // Загрузка пользователя из localStorage, если не пришёл через props
    if (!propUser) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) setUser(storedUser);
    }
  }, [propUser]);

  useEffect(() => {
    fetchTasks().then(setTasks);
    fetchMyTeam().then(team => {
      setTeam(team);
      setTeamMembers(team?.members || []);
    });
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newTask = await addTask({
      text,
      assignedTo: isOwner ? assignedTo || undefined : undefined,
      deadline: deadline || undefined,
      labels: tags ? tags.split(',').map(t => t.trim()) : [],
    });

    setTasks([newTask, ...tasks]);
    setText('');
    setAssignedTo('');
    setDeadline('');
    setTags('');
  };

  const handleToggle = async (id, completed) => {
    const updated = await updateTask(id, { completed });
    setTasks(tasks.map((t) => (t._id === id ? updated : t)));
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Ошибка при удалении задачи:', err);
      alert('Ошибка при удалении задачи');
    }
  };

  const handleDateFilter = async () => {
    const filtered = await fetchTasks({ from: fromDate, to: toDate });
    setTasks(filtered);
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (filter === 'completed') filtered = filtered.filter((t) => t.completed);
    else if (filter === 'active') filtered = filtered.filter((t) => !t.completed);
    if (search.trim()) {
      filtered = filtered.filter((t) => t.text.toLowerCase().includes(search.toLowerCase()));
    }
    return filtered;
  };

  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = total - completedCount;

  return (
    <div className="container">
      <h1>Мои задачи ({user?.name || '—'})</h1>

      <form onSubmit={handleAdd} className="task-form">
        <input placeholder="Новая задача" value={text} onChange={e => setText(e.target.value)} required />
        {isOwner ? (
          <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Исполнитель</option>
            {teamMembers.map(member => (
              <option key={member._id} value={member._id}>{member.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={user?.name || ''}
            disabled
            style={{ backgroundColor: '#eee', cursor: 'not-allowed' }}
          />
        )}
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <input placeholder="Метки через запятую" value={tags} onChange={e => setTags(e.target.value)} />
        <button type="submit">Добавить</button>
      </form>

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Все</button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Активные</button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Выполненные</button>
      </div>

      <div className="date-search-row">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button onClick={handleDateFilter}>Применить</button>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск задач..."
        />
      </div>

      <div className="stats">
        Всего: {total} | Выполнено: {completedCount} | Осталось: {activeCount}
      </div>

      <ul className="task-list">
        {getFilteredTasks().map((task) => {
          const authorId = task.author?._id?.toString();
          const assignedId = task.assignedTo?._id?.toString();
          const userId = user?._id?.toString() || user?.id?.toString();

          const canDelete = isOwner || (userId && authorId === userId && assignedId === userId);

          return (
            <li key={task._id} className="task-item">
              <div>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task._id, !task.completed)}
                />
                <span className={task.completed ? 'done' : ''}>{task.text}</span>
                <div className="task-meta">
                  <div>Создано: {new Date(task.createdAt).toLocaleString('ru-RU')}</div>
                  <div>Автор: {task.author?.name || '—'}</div>
                  <div>Исполнитель: {task.assignedTo?.name || '—'}</div>
                  <div>Дедлайн: {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : '—'}</div>
                  <div>Метки: {task.labels?.join(', ') || '—'}</div>
                </div>
              </div>
              {canDelete && (
                <button onClick={() => handleDelete(task._id)}>Удалить</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
