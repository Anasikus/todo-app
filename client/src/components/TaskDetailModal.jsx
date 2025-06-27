import { useState, useEffect } from 'react';
import CommentModal from './CommentModal';
import TaskHistoryModal from './TaskHistoryModal';
import EditTaskModal from './EditTaskModal';
import { deleteTask, updateTask } from '../api/tasks';
import { fetchMyTeam } from '../api/team';
import '../styles/TaskDetailModal.css';

export default function TaskDetailModal({ task, user, onClose, onTaskUpdated }) {
  const [team, setTeam] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTaskForComments, setActiveTaskForComments] = useState(null);
  const [activeTaskForHistory, setActiveTaskForHistory] = useState(null);

  useEffect(() => {
    fetchMyTeam().then(setTeam);
  }, []);

  const userId = String(user?._id || user?.id || '');
  const ownerId = String(team?.owner || '');
  const isTaskAuthor = String(task.author?._id || task.author) === userId;
  const isTaskExecutor = String(task.assignedTo?._id || task.assignedTo) === userId;
  const isOwner = userId === ownerId;
  const canEditOrDelete = isOwner || (isTaskAuthor && isTaskExecutor);

  const handleDelete = async () => {
    try {
      await deleteTask(task._id);
      onClose();
    } catch (err) {
      console.error('Ошибка при удалении задачи:', err);
      alert('Ошибка при удалении задачи');
    }
  };

  const handleSave = async (updatedData) => {
    try {
      const updatedTask = await updateTask(task._id, updatedData);
      if (onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }
      setEditingTask(null);
    } catch (err) {
      alert('Ошибка при сохранении задачи');
      console.error(err);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>{task.text}</h3>
        <p><strong>Автор:</strong> {task.author?.name || '—'}</p>
        <p><strong>Исполнитель:</strong> {task.assignedTo?.name || '—'}</p>
        <p><strong>Дедлайн:</strong> {task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : '—'}</p>
        <p><strong>Метки:</strong> {task.labels?.join(', ') || '—'}</p>
        <p><strong>Создано:</strong> {new Date(task.createdAt).toLocaleString('ru-RU')}</p>

        <div className="modal-actions">
          <button onClick={() => setActiveTaskForComments(task)}>💬 Комментарии</button>
          <button onClick={() => setActiveTaskForHistory(task._id)}>📜 История</button>
          {canEditOrDelete && (
            <>
              <button onClick={() => setEditingTask(task)}>✏️ Редактировать</button>
              <button onClick={handleDelete} style={{ color: 'red' }}>🗑️ Удалить</button>
            </>
          )}
        </div>
      </div>

      {activeTaskForComments && (
        <CommentModal
          task={activeTaskForComments}
          user={user}
          onClose={() => setActiveTaskForComments(null)}
        />
      )}

      {activeTaskForHistory && (
        <TaskHistoryModal
          taskId={activeTaskForHistory}
          onClose={() => setActiveTaskForHistory(null)}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          user={user}
          onSave={handleSave}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
