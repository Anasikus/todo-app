import { useEffect, useState } from 'react';
import { fetchMyInvites, acceptInvite, declineInvite } from '../api/invite';

export default function InviteList({ onAccepted }) {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    fetchMyInvites().then(setInvites);
  }, []);

  const handleAccept = async (id) => {
    await acceptInvite(id);
    setInvites(invites.filter((i) => i._id !== id));
    if (onAccepted) onAccepted(); // например, обновить команду
  };

  const handleDecline = async (id) => {
    await declineInvite(id);
    setInvites(invites.filter((i) => i._id !== id));
  };

  if (!invites.length) return null;

  return (
    <div style={{ background: '#e6f7ff', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
      <h3>Приглашения</h3>
      <ul style={{ paddingLeft: 20 }}>
        {invites.map((invite) => (
          <li key={invite._id} style={{ marginBottom: '8px' }}>
            Вас пригласили в команду <strong>{invite.team.name}</strong>
            <div style={{ marginTop: 5 }}>
              <button onClick={() => handleAccept(invite._id)} style={{ marginRight: 8 }}>Принять</button>
              <button onClick={() => handleDecline(invite._id)}>Отклонить</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
