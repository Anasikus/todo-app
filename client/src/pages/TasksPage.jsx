import { useEffect, useState } from 'react';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { fetchTasks, addTask, deleteTask, updateTask } from '../api/tasks';
import { fetchMyTeam } from '../api/team';
import CreateTeamForm from '../components/CreateTeamForm';
import InviteForm from '../components/InviteForm';
import InviteList from '../components/InviteList';

export default function TasksPage({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState(null);

  useEffect(() => {
    fetchTasks().then(setTasks);

    fetchMyTeam()
      .then(setTeam)
      .catch((err) => {
        console.error('Ошибка загрузки команды:', err.message);
        setTeam(null);
      });
  }, []);

  const handleAdd = async (text) => {
    const newTask = await addTask(text);
    setTasks([newTask, ...tasks]);
  };

  const handleToggle = async (id, completed) => {
    const updated = await updateTask(id, { completed });
    setTasks(tasks.map((t) => (t._id === id ? updated : t)));
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks(tasks.filter((t) => t._id !== id));
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (filter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    } else if (filter === 'active') {
      filtered = filtered.filter((t) => !t.completed);
    }

    if (search.trim()) {
      filtered = filtered.filter((t) =>
        t.text.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = total - completedCount;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Мои задачи ({user?.name})</h1>
        <button onClick={onLogout}>Выйти</button>
      </div>

      <InviteList onAccepted={() => {
        fetchMyTeam().then(setTeam).catch(() => setTeam(null));
      }} />

      {team ? (
        <div style={{ background: '#f1f1f1', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Команда: {team.name}</h3>
          <div style={{ fontSize: '14px', color: '#555' }}>
            Участники: {team?.members?.map((m) => m.name).join(', ') || 'Нет участников'}
          </div>
          <InviteForm />
        </div>
      ) : (
        <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          <strong>Вы не состоите в команде.</strong>
          <CreateTeamForm onTeamCreated={setTeam} />
        </div>
      )}

      <TaskForm onAdd={handleAdd} />

      <div className="filters">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>Все</button>
        <button onClick={() => setFilter('active')} className={filter === 'active' ? 'active' : ''}>Активные</button>
        <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>Выполненные</button>
      </div>

      <input
        type="text"
        placeholder="Поиск задач..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ margin: '10px 0', padding: '6px', width: '100%' }}
      />

      <div className="stats" style={{ marginBottom: '10px' }}>
        <strong>Всего:</strong> {total} | <strong>Выполнено:</strong> {completedCount} | <strong>Осталось:</strong> {activeCount}
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
