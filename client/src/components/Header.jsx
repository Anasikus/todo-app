import '../styles/Header.css';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { fetchNotifications, markNotificationAsRead, clearNotifications } from '../api/notifications';
import io from 'socket.io-client';

export default function Header({ onLogout, user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const socketRef = useRef(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    fetchNotifications().then(setNotifications);
    const token = localStorage.getItem('token');
    console.log('🪪 Токен:', token);

    socketRef.current = io('http://localhost:4000', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket']
    });

    socketRef.current.on('notification', async () => {
      try {
        const updated = await fetchNotifications();
        setNotifications(updated);
      } catch (e) {
        console.error('Ошибка обновления уведомлений:', e);
      }

      if (userInteractedRef.current) {
        const audio = new Audio('/sounds/notify.mp3');
        audio.play().catch(err => console.log('❌ Не удалось воспроизвести звук:', err));
      }
    });
    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket.IO connection error:", err.message);
    });

    const enableAudio = () => {
      userInteractedRef.current = true;
      document.removeEventListener('click', enableAudio);
    };
    document.addEventListener('click', enableAudio, { once: true });

    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('click', enableAudio);
      socketRef.current.disconnect();
    };
  }, [user]);

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = async () => {
    await clearNotifications();
    setNotifications([]);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo"><Link to="/tasks">Todo</Link></div>
        <nav className="nav-links">
          <Link to="/tasks">Задачи</Link>
          <Link to="/team">Команда</Link>
        </nav>

        <div className="header-right">
          <div className="notification-wrapper" ref={notificationRef}>
            <button className="icon-button bell-button" onClick={() => setShowNotifications(!showNotifications)}>
              <FaBell />
              {notifications.some(n => !n.read) && (
                <span className="notification-count">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-popup">
                <div className="notif-header">
                  <h4>Уведомления</h4>
                  <button onClick={handleClearAll} className="clear-btn">Очистить все</button>
                </div>
                {notifications.length === 0 ? (
                  <p>Нет уведомлений</p>
                ) : (
                  <ul>
                    {notifications.map(n => (
                      <li
                        key={n._id}
                        onClick={() => handleMarkAsRead(n._id)}
                        style={{ background: n.read ? '#eee' : '#fff', cursor: 'pointer' }}
                      >
                        {n.type === 'comment' ? (
                          <>
                            💬 <strong>{n.fromUser?.name}</strong> написал комментарий к задаче:<br />
                            <em>{n.comment?.text}</em>
                          </>
                        ) : (
                          <>
                            📌 Назначена новая задача:<br />
                            <strong>{n.task?.text}</strong>
                          </>
                        )}
                        <div className="notif-time">
                          {new Date(n.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button className="logout-button" onClick={onLogout}>Выйти</button>
        </div>
      </div>
    </header>
  );
}
