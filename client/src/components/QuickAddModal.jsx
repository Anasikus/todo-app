import { useEffect, useState } from 'react';
import { addTask, updateTask, deleteTask } from '../api/tasks';
import TaskHistoryModal from './TaskHistoryModal';
import CommentModal from './CommentModal';

export default function QuickAddModal({
  date,
  user,
  teamMembers = [],
  onClose,
  onTaskAdded,
  task = null, // если передан, значит редактирование
  team = null
}) {
  const [text, setText] = useState(task?.text || '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || task?.assignedTo || '');
  const [tags, setTags] = useState(task?.labels?.join(', ') || '');
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const userId = user?._id || user?.id;
  const isOwner = team?.owner === userId;
  const isAuthor = String(task?.author?._id || task?.author) === String(userId);
  const isExecutor = String(task?.assignedTo?._id || task?.assignedTo) === String(userId);
  const canEditOrDelete = isOwner || (isAuthor && isExecutor);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const payload = {
      text,
      deadline: date,
      assignedTo: isOwner ? (assignedTo || userId) : userId,
      labels: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    if (task) {
      const updated = await updateTask(task._id, payload);
      onTaskAdded(updated);
    } else {
      const newTask = await addTask(payload);
      onTaskAdded(newTask);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Удалить эту задачу?')) {
      await deleteTask(task._id);
      onTaskAdded(null); // обновление родителя
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{task ? 'Редактировать задачу' : `Добавить задачу на ${new Date(date).toLocaleDateString('ru-RU')}`}</h3>
        <form onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Текст задачи"
            autoFocus
            required
          />
          {isOwner && (
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">Исполнитель</option>
              {teamMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Метки (через запятую)"
          />
          <button type="submit">{task ? 'Сохранить' : 'Добавить'}</button>
        </form>

        {task && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowComments(true)}>Комментарии</button>
            {canEditOrDelete && (
              <>
                <button onClick={handleDelete} style={{ color: 'red' }}>Удалить</button>
              </>
            )}
            <button onClick={() => setShowHistory(true)}>История</button>
          </div>
        )}

        {showHistory && (
          <TaskHistoryModal
            taskId={task._id}
            onClose={() => setShowHistory(false)}
          />
        )}

        {showComments && (
          <CommentModal
            task={task}
            user={user}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>
    </div>
  );
}
