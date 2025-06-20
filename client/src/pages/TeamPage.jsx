import { useEffect, useState } from 'react';
import { fetchMyTeam, fetchAvailableTeams } from '../api/team';
import CreateTeamForm from '../components/CreateTeamForm';
import TeamAdminPanel from '../components/TeamAdminPanel';
import InviteForm from '../components/InviteForm';

export default function TeamPage({ user }) {
  const [team, setTeam] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);

  useEffect(() => {
    fetchMyTeam()
      .then(setTeam)
      .catch(() => setTeam(null));

    fetchAvailableTeams().then(setAvailableTeams);
  }, []);

  return (
    <div className="container">
      {team ? (
        <div>
          <h2>Команда: {team.name}</h2>
          <p>Участники:</p>
          <ul>
            {team.members.map((member) => (
              <li key={member._id}>
                {member.name} — {member.email} {team.owner === member._id && '(Владелец)'}
              </li>
            ))}
          </ul>
          <InviteForm />
          <TeamAdminPanel currentUser={user} />
        </div>
      ) : (
        <div>
          <h3>Вы не состоите в команде</h3>
          <CreateTeamForm onTeamCreated={setTeam} />
          <h4>Доступные команды:</h4>
          <ul>
            {availableTeams.map((t) => (
              <li key={t._id}>{t.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}