import { useEffect, useRef, useState } from 'react';
import '../styles/EditTaskModal.css';

export default function EditTaskModal({ task, user, onSave, onClose }) {
  const [text, setText] = useState(task.text || '');
  const [deadline, setDeadline] = useState(task.deadline?.slice(0, 10) || '');
  const [labels, setLabels] = useState(task.labels?.join(', ') || '');
  const [assignedTo, setAssignedTo] = useState(task.assignedTo?._id || task.assignedTo || '');
  const [teamMembers, setTeamMembers] = useState([]);
  const modalRef = useRef(null);

  const isOwner = user?.role?.toLowerCase?.() === 'owner';

  useEffect(() => {
    if (isOwner) {
      fetch('http://localhost:4000/api/team/my', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setTeamMembers(data?.members || []);
        })
        .catch(err => console.error('Ошибка при загрузке команды:', err));
    }
  }, [isOwner]);

  useEffect(() => {
    setText(task.text || '');
    setDeadline(task.deadline?.slice(0, 10) || '');
    setLabels(task.labels?.join(', ') || '');
    setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
  }, [task]);

  useEffect(() => {
    // Закрытие при клике вне модалки
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {
      text: text.trim(),
      deadline,
      labels: labels.split(',').map(t => t.trim()).filter(Boolean)
    };
    if (isOwner) updates.assignedTo = assignedTo;
    onSave(updates);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" ref={modalRef}>
        <h2>{task.isNew ? 'Создать задачу' : 'Редактировать задачу'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Название задачи"
            required
          />
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <input
            type="text"
            placeholder="Метки через запятую"
            value={labels}
            onChange={e => setLabels(e.target.value)}
          />
          {isOwner && (
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Выберите исполнителя</option>
              {teamMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
          <div className="modal-actions">
            <button type="submit">{task.isNew ? 'Создать' : 'Сохранить'}</button>
            <button type="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
