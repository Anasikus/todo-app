import { useState } from 'react';
import { createTeam } from '../api/team';

export default function CreateTeamForm({ onTeamCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await createTeam(name);
    setLoading(false);

    if (result._id) {
      onTeamCreated(result); // передаём новую команду в родитель
    } else {
      alert(result.error || 'Ошибка при создании команды');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>Создать команду</h3>
      <input
        type="text"
        placeholder="Название команды"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: '8px', width: '100%', marginBottom: '8px' }}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
}
