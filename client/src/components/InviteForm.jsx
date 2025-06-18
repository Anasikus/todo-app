import { useState } from 'react';
import { sendInvite } from '../api/invite';

export default function InviteForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await sendInvite(email);
      setMessage(res.message);
      setEmail('');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h4>Пригласить в команду</h4>
      <input
        type="email"
        placeholder="Email участника"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ padding: '8px', width: '100%', marginBottom: '8px' }}
      />
      <button type="submit">Отправить приглашение</button>
      {message && <div style={{ marginTop: '8px', color: 'green' }}>{message}</div>}
    </form>
  );
}
