import { useEffect, useState } from 'react';
import {
  fetchMyTeam,
  fetchAvailableTeams,
  approveRequest,
  rejectRequest,
  removeMember,
  setTeamOwner,
  renameTeam,
  leaveTeam,
  createTeam
} from '../api/team';
import {
  sendInvite,
  fetchMyInvites,
  acceptInvite,
  declineInvite
} from '../api/invite';
import '../styles/TeamPage.css';
import Swal from 'sweetalert2';
import InviteModal from '../components/InviteModal';

export default function TeamPage({ user }) {
  const [team, setTeam] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const isOwner = team?.owner === user?.id || team?.owner === user?._id;

  const refresh = async () => {
    try {
      setTeam(await fetchMyTeam());
    } catch {
      setTeam(null);
    }
    setAvailableTeams(await fetchAvailableTeams());
    setInvites(await fetchMyInvites());
  };

  useEffect(() => { refresh(); }, []);


  // Invitation handlers
  const handleInvite = async e => {
    e.preventDefault();
    try {
      const res = await sendInvite(inviteEmail);
      setInviteMessage(res.message);
      setInviteEmail('');
    } catch (e) { setInviteMessage(e.message); }
  };
  const acceptInviteHandler = id => async () => { await acceptInvite(id); refresh(); };
  const declineInviteHandler = id => async () => { await declineInvite(id); setInvites(invites.filter(i => i._id !== id)); };

  // Team management
  const handleApprove = id => async () => { await approveRequest(id); refresh(); };
  const handleReject = id => async () => { await rejectRequest(id); refresh(); };
  const handleRemove = id => async () => { // eslint-disable-next-line no-restricted-globals
    if (confirm("Удалить участника?")) { await removeMember(id); refresh(); } };
  const handleMakeOwner = id => async () => { await setTeamOwner(id); refresh(); };
  const handleRename = async () => { if (!newTeamName.trim()) return; await renameTeam(newTeamName); refresh(); };
  const handleLeave = async () => {
  const result = await Swal.fire({
    title: 'Выйти из команды?',
    text: 'Вы уверены, что хотите покинуть команду?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Да, выйти',
    cancelButtonText: 'Отмена'
  });

  if (result.isConfirmed) {
    await leaveTeam();
    await refresh();
    Swal.fire('Готово!', 'Вы покинули команду.', 'success');
  }
};
  const handleCreate = async e => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    const res = await createTeam(newTeamName);
    setCreating(false);
    if (res._id) { setTeam(res); setNewTeamName(''); }
    else alert(res.error);
  };

  return (
    <div className="team-page">
      <h2>Управление командой</h2>

      {/* Invitations to join */}
      {invites.length > 0 && (
        <section className="box invites">
          <h3>Приглашения в команду</h3>
          {invites.map(inv => (
            <div key={inv._id} className="invite-row">
              <strong>{inv.team.name}</strong>
              <button onClick={acceptInviteHandler(inv._id)}>Принять</button>
              <button onClick={declineInviteHandler(inv._id)}>Отклонить</button>
            </div>
          ))}
        </section>
      )}

      {team ? (
        <section className="box current-team">
          <div className="team-header">
            <h3>Команда: {team.name}</h3>
            {isOwner && (
              <div className="rename-row">
                <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                <button onClick={handleRename}>Переименовать</button>
              </div>
            )}
          </div>

          <div className="button-row">
            {isOwner && (
                    <>
                      <button onClick={() => setIsInviteOpen(true)}>Пригласить участника</button>
                      <InviteModal
                        isOpen={isInviteOpen}
                        onClose={() => setIsInviteOpen(false)}
                        isOwner={isOwner}
                        onInviteSent={refresh}
                      />
                    </>
                  )}
            <button onClick={handleLeave}>Выйти из команды</button>
          </div>

          <ul className="member-list">
            {team.members.map(m => (
              <li key={m._id} className="member-row">
                <span>{m.name} ({m.email})</span>
                {team.owner === m._id ? (
                  <em>Владелец</em>
                ) : (
                  isOwner && (
                    <div className="member-actions">
                      <button onClick={handleMakeOwner(m._id)}>Сделать владельцем</button>
                      <button onClick={handleRemove(m._id)}>Удалить</button>
                    </div>
                  )
                )}
              </li>
            ))}
          </ul>

          {/* Requests to join */}
          {team.pendingRequests?.length > 0 && (
            <section className="box requests">
              <h3>Заявки на вступление</h3>
              {team.pendingRequests.map(r => (
                <div key={r._id} className="invite-row">
                  {r.name} ({r.email})
                  <button onClick={handleApprove(r._id)}>Принять</button>
                  <button onClick={handleReject(r._id)}>Отклонить</button>
                </div>
              ))}
            </section>
          )}
        </section>
      ) : (
        <section className="box available-teams">
          <h3>Вы не в команде</h3>
          <form onSubmit={handleCreate} className="create-team">
            <input
              type="text"
              placeholder="Название новой команды"
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Создается...' : 'Создать'}
            </button>
          </form>

          <h4>Доступные команды для присоединения:</h4>
          <ul>
            {availableTeams.map(t => (
              <li key={t._id}>{t.name}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
