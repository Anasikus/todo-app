import { useEffect, useState } from 'react';
import { fetchMyTeam, setTeamOwner } from '../api/team';

export default function TeamAdminPanel({ currentUser }) {
  const [team, setTeam] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyTeam()
      .then(setTeam)
      .catch(err => setError(err.message));
  }, []);

  const handleSetOwner = async (userId) => {
    try {
      await setTeamOwner(userId);
      const updated = await fetchMyTeam();
      setTeam(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!team || !currentUser || !team.owner) return null;
  const isOwner = team.owner === currentUser._id;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Панель администратора</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {team.members.map(member => (
          <li key={member._id}>
            {member.name} ({member.email})
            {team.owner === member._id ? ' — Владелец' :
              isOwner && (
                <button style={{ marginLeft: '10px' }} onClick={() => handleSetOwner(member._id)}>
                  Сделать владельцем
                </button>
              )
            }
          </li>
        ))}
      </ul>
    </div>
  );
}
