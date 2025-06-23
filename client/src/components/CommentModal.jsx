import { useState, useEffect } from 'react';
import { fetchComments, addComment, editComment, deleteComment } from '../api/comments';
import { FiEdit, FiTrash2, FiCheck, FiX, FiPaperclip } from 'react-icons/fi';
import '../styles/modal.css';

export default function CommentModal({ task, user, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (task?._id) {
      fetchComments(task._id).then(setComments).catch(console.error);
    }
  }, [task?._id]);

  const handleAdd = async () => {
    if (!text.trim() && !file) return;
    try {
      const data = new FormData();
      data.append('text', text);
      if (file) data.append('file', file);
      const newComment = await addComment(task._id, data);
      setComments(prev => [...prev, newComment]);
      setText('');
      setFile(null);
    } catch (err) {
      console.error('Ошибка при добавлении комментария:', err);
    }
  };

  const handleEdit = async (c) => {
    try {
      const updated = await editComment(task._id, c._id, { text: editText });
      setComments(cs => cs.map(x => x._id === c._id ? updated : x));
      setEditingId(null);
    } catch (err) {
      console.error('Ошибка при редактировании комментария:', err);
    }
  };

  const handleDelete = async (c) => {
    try {
      await deleteComment(task._id, c._id);
      setComments(cs => cs.filter(x => x._id !== c._id));
    } catch (err) {
      console.error('Ошибка при удалении комментария:', err);
    }
  };

  if (!task || !user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>Обсуждение: {task.text}</h2>

        <div className="comments-section">
          {comments.length === 0 && <p className="no-comments">Комментариев пока нет.</p>}

          {comments.map(c => {
            const userId = user?.id || user?._id;
            const isAuthor = String(c.author?._id) === String(userId);
            return (
              <div key={c._id} className="comment-item">
                <div className="text">
                  <strong>{c.author?.name || 'Неизвестный'}</strong>:&nbsp;

                  {editingId === c._id ? (
                    <>
                      <input value={editText} onChange={e => setEditText(e.target.value)} />
                      <button className="icon-btn" onClick={() => handleEdit(c)}><FiCheck /></button>
                      <button className="icon-btn" onClick={() => setEditingId(null)}><FiX /></button>
                    </>
                  ) : (
                    <>
                      <span>{c.text}</span>
                      {c.fileUrl && (
                        <>
                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(c.fileUrl) ? (
                            <img
                              src={`http://localhost:4000${c.fileUrl}`}
                              alt="Изображение"
                              className="comment-image"
                            />
                          ) : (
                            <a
                              href={`http://localhost:4000${c.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FiPaperclip />
                            </a>
                          )}
                        </>
                      )}
                      {isAuthor && (
                        <span style={{ marginLeft: 10 }}>
                          <button className="icon-btn" onClick={() => { setEditingId(c._id); setEditText(c.text); }}><FiEdit /></button>
                          <button className="icon-btn delete" onClick={() => handleDelete(c)}><FiTrash2 /></button>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="add-comment">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ваш комментарий..."
          />
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <button onClick={handleAdd}>Добавить</button>
        </div>
      </div>
    </div>
  );
}
