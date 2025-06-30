import { useState, useEffect, useMemo } from 'react';
import { fetchTasks } from '../api/tasks';
import { fetchMyTeam } from '../api/team';
import Select from 'react-select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [period, setPeriod] = useState('7'); // дней
  const [userFilter, setUserFilter] = useState(null);

  // Загрузка задач и участников команды
  useEffect(() => {
    fetchTasks().then(setTasks);
    fetchMyTeam().then(team => {
      setTeamMembers(team?.members || []);
    });
  }, []);

  // Преобразование данных в формат для графика
  const data = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - parseInt(period));

    const bucket = {};
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      bucket[key] = { date: key, total: 0, done: 0, overdue: 0 };
    }

    tasks.forEach(task => {
      const created = task.createdAt.slice(0, 10);
      if (!(created in bucket)) return;

      if (userFilter && task.assignedTo?._id !== userFilter.value) return;

      bucket[created].total++;
      if (task.completed) bucket[created].done++;
      else if (task.deadline && new Date(task.deadline) < now) bucket[created].overdue++;
    });

    return Object.values(bucket);
  }, [tasks, period, userFilter]);

  const userOptions = teamMembers.map(u => ({
    value: u._id,
    label: u.name
  }));

  return (
    <div style={{ padding: 20 }}>
      <h2>Аналитика задач</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">7 дней</option>
          <option value="30">30 дней</option>
          <option value="90">90 дней</option>
        </select>

        <Select
          value={userFilter}
          onChange={setUserFilter}
          options={userOptions}
          isClearable
          placeholder="Все участники"
          styles={{ container: s => ({ ...s, width: 200 }) }}
        />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#8884d8" name="Всего" />
          <Line type="monotone" dataKey="done" stroke="#82ca9d" name="Выполнено" />
          <Line type="monotone" dataKey="overdue" stroke="#f24" name="Просрочено" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
