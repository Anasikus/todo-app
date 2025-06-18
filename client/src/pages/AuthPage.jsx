import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

export default function AuthPage({ onLogin }) {
  return (
    <div>
      <LoginForm onLogin={onLogin} />
      <RegisterForm />
    </div>
  );
}
