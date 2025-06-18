import { useState } from 'react';

export default function TaskForm({ onAdd }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} style={{marginTop: "5px"}}>
      <input
        placeholder="Новая задача"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{width: "95%", borderRadius: "5px"}}
      />
      <button type="submit">Добавить</button>
    </form>
  );
}
