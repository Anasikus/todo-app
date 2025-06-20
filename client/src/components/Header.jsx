import '../styles/Header.css';
import { Link } from 'react-router-dom';

export default function Header({ onLogout }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/tasks">TaskFlow</Link>
        </div>
        <nav className="nav-links">
          <Link to="/tasks">Задачи</Link>
          <Link to="/team">Команда</Link>
        </nav>
        <button className="logout-button" onClick={onLogout}>Выйти</button>
      </div>
    </header>
  );
}
