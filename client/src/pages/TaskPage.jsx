import { useEffect, useState } from 'react';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { fetchTasks, addTask, deleteTask, updateTask } from '../api/tasks';

export default function TaskPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchTasks().then(setTasks);
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
      <h1>Мои задачи ({user?.name})</h1>
      <TaskForm onAdd={handleAdd} />

      <div>
        <button onClick={() => setFilter('all')}>Все</button>
        <button onClick={() => setFilter('active')}>Активные</button>
        <button onClick={() => setFilter('completed')}>Выполненные</button>
      </div>

      <div>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <button onClick={handleDateFilter}>Применить</button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск задач..."
      />

      <div>
        <strong>Всего:</strong> {total} | <strong>Выполнено:</strong> {completedCount} | <strong>Осталось:</strong> {activeCount}
      </div>

      <TaskList tasks={getFilteredTasks()} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  );
}