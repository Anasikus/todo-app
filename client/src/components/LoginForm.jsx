import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import '../styles/auth.css';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.token) {
      onLogin(result.token, result.user);
      navigate('/tasks');
    } else {
      alert(result.error || 'Ошибка входа');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Вход</h2>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Пароль" required />
        <button type="submit">Войти</button>
        <div className="switch-link">
          Ещё нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </div>
      </form>
    </div>
  );
}
