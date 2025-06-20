import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import LoginPage from './components/LoginForm';
import RegisterPage from './components/RegisterForm';
import Header from './components/Header';
import TaskPage from './pages/TaskPage';
import TeamPage from './pages/TeamPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
  };

  return (
    <Router>
      {token && <Header onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/tasks" : "/login"} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute token={token}>
              <TaskPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute token={token}>
              <TeamPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<h2 style={{ padding: '20px' }}>404 — Страница не найдена</h2>} />
      </Routes>
    </Router>
  );
}
