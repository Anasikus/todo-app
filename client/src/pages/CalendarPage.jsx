import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
  format, parse, startOfWeek, getDay, isSameDay, isPast
} from 'date-fns';
import ru from 'date-fns/locale/ru';
import { fetchTasks, addTask, updateTask } from '../api/tasks';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import TaskDetailModal from '../components/TaskDetailModal';
import EditTaskModal from '../components/EditTaskModal';
import '../styles/TaskDetailModal.css';

const locales = { ru };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales
});

export default function CalendarPage({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || null);
  const [allTasks, setAllTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const storedUser = propUser || JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    } else {
      navigate('/login');
    }
  }, [propUser, navigate]);

  const loadTasks = async () => {
    try {
      const tasks = await fetchTasks();
      setAllTasks(tasks);
    } catch (err) {
      console.error('Ошибка при загрузке задач', err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const filteredTasks = onlyMine
      ? allTasks.filter(
          t =>
            String(t.assignedTo?._id || t.assignedTo) ===
            String(user?._id || user?.id)
        )
      : allTasks;

    const ev = filteredTasks
      .filter(t => t.deadline)
      .map(t => {
        const deadline = new Date(t.deadline);
        const isCompleted = t.completed;
        const isOverdue =
          !isCompleted && isPast(deadline) && !isSameDay(deadline, new Date());

        const color = isCompleted
          ? '#4caf50'
          : isOverdue
          ? '#f44336'
          : '#2196f3';

        return {
          title: t.text,
          start: new Date(deadline.setHours(12)),
          end: new Date(deadline.setHours(12)),
          task: t,
          allDay: true,
          color
        };
      });

    setEvents(ev);
  }, [allTasks, onlyMine, user]);

  const eventStyleGetter = event => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      display: 'block'
    }
  });

  const handleMonthChange = e => {
    const [year, month] = e.target.value.split('-');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), i, 1);
    return (
      <option key={i} value={`${currentDate.getFullYear()}-${i + 1}`}>
        {format(date, 'LLLL', { locale: ru })}
      </option>
    );
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  });

  return (
    <div className="calendar-page">
      <div className="calendar-controls">
        <label>
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={() => setOnlyMine(!onlyMine)}
          />
          Только мои задачи
        </label>
        <div className="calendar-selects">
          <button onClick={handlePrevMonth}>←</button>
          <select
            value={`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`}
            onChange={handleMonthChange}
          >
            {monthOptions}
          </select>
          <select
            value={currentDate.getFullYear()}
            onChange={e =>
              setCurrentDate(
                new Date(Number(e.target.value), currentDate.getMonth(), 1)
              )
            }
          >
            {yearOptions}
          </select>
          <button onClick={handleNextMonth}>→</button>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{
          height: '100%',
          backgroundColor: '#f0f2f5',
          padding: 10,
          borderRadius: 10
        }}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={e => setSelectedTask(e.task)}
        onSelectSlot={({ start }) => {
          const normalizedStart = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
            12
          );
          setEditingTask({
            text: '',
            assignedTo: user?._id || user?.id || '',
            deadline: normalizedStart.toISOString(),
            labels: [],
            isNew: true
          });
        }}
        selectable
        eventPropGetter={eventStyleGetter}
        views={['month']}
        popup
        culture="ru"
        messages={{
          week: 'Неделя',
          work_week: 'Рабочая неделя',
          day: 'День',
          month: 'Месяц',
          previous: 'Назад',
          next: 'Вперёд',
          today: 'Сегодня',
          agenda: 'Повестка дня',
          date: 'Дата',
          time: 'Время',
          event: 'Событие',
          showMore: total => `+ ещё ${total}`,
          noEventsInRange: 'Нет задач в этот период',
          allDay: 'Весь день'
        }}
      />

      {selectedTask && user && (
        <TaskDetailModal
          task={selectedTask}
          user={user}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updatedTask) => {
            setAllTasks(prev =>
              prev.map(t => (t._id === updatedTask._id ? updatedTask : t))
            );
            setSelectedTask(updatedTask);
          }}
          onTaskDeleted={() => {
            setAllTasks(prev => prev.filter(t => t._id !== selectedTask._id));
            setSelectedTask(null);
          }}
        />
      )}

      {editingTask && user && (
        <EditTaskModal
          task={editingTask}
          user={user}
          onClose={() => setEditingTask(null)}
          onSave={async newTaskData => {
            try {
              if (editingTask.isNew) {
                const createdTask = await addTask(newTaskData);
                setAllTasks(prev => [createdTask, ...prev]);
              } else {
                const updatedTask = await updateTask(editingTask._id, newTaskData);
                setAllTasks(prev =>
                  prev.map(t =>
                    t._id === updatedTask._id ? updatedTask : t
                  )
                );
                if (selectedTask && selectedTask._id === updatedTask._id) {
                  setSelectedTask(updatedTask);
                }
              }
            } catch (err) {
              alert('Ошибка при сохранении задачи');
              console.error(err);
            }
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
