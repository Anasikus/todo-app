import { useEffect, useState } from 'react';
import { fetchMyTeam, setTeamOwner, removeMember, renameTeam } from '../api/team';

export default function TeamAdminPanel({ currentUser }) {
  const [team, setTeam] = useState(null);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchMyTeam()
      .then(data => {
        setTeam(data);
        setNewName(data.name);
      })
      .catch(err => setError(err.message));
  }, []);

  const isOwner = team && currentUser && team.owner === currentUser._id;

  const refreshTeam = async () => {
    try {
      const updated = await fetchMyTeam();
      setTeam(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetOwner = async (userId) => {
    try {
      await setTeamOwner(userId);
      await refreshTeam();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (userId) => {
    if (window.confirm('Удалить участника из команды?')) {
      try {
        await removeMember(userId);
        await refreshTeam();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleRename = async () => {
    try {
      await renameTeam(newName);
      await refreshTeam();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!team || !currentUser || !team.owner) return null;

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Панель администратора</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {isOwner && (
        <div style={{ marginBottom: '20px' }}>
          <label>
            Новое название команды:{' '}
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ marginRight: '10px' }}
            />
          </label>
          <button onClick={handleRename}>Сохранить</button>
        </div>
      )}

      <ul>
        {team.members.map((member) => (
          <li key={member._id}>
            {member.name} ({member.email})
            {team.owner === member._id ? (
              ' — Владелец'
            ) : (
              <>
                {isOwner && (
                  <>
                    <button onClick={() => handleSetOwner(member._id)} style={{ marginLeft: '10px' }}>
                      Сделать админом
                    </button>
                    <button onClick={() => handleRemove(member._id)} style={{ marginLeft: '10px', color: 'red' }}>
                      Удалить
                    </button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
