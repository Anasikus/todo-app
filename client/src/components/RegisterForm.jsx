import { useState } from 'react';
import { register } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const result = await register({ name, email, password });
    if (result.message) {
      alert('Регистрация прошла успешно!');
      navigate('/login');
    } else {
      alert(result.error || 'Ошибка при регистрации');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={submit}>
        <h2>Регистрация</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Пароль" required />
        <button type="submit">Зарегистрироваться</button>
        <div className="switch-link">
          Уже есть аккаунт? <Link to="/login">Войдите</Link>
        </div>
      </form>
    </div>
  );
}
