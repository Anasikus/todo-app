import { useState } from 'react';
import { sendInvite } from '../api/invite';

export default function InviteModal({ isOpen, onClose, isOwner, onInviteSent }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await sendInvite(inviteEmail);
      setInviteMessage(res.message);
      setInviteEmail('');
      if (onInviteSent) onInviteSent();
    } catch (err) {
      setInviteMessage(err.message || 'Ошибка при отправке приглашения');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <form onSubmit={handleInvite} className="box invite-form">
          <h4>Приглашение по email</h4>
          <input
            type="email"
            placeholder="Email участника"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={!isOwner}>Отправить</button>
          {inviteMessage && <div className="message">{inviteMessage}</div>}
        </form>
      </div>
    </div>
  );
}
