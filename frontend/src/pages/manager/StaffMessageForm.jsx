// src/components/StaffMessageForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../../services/socket';

export default function StaffMessageForm({ staffId, staffUserId }) {
  const [content, setContent] = useState('');

  useEffect(()=> {
    socket.connect();
    socket.emit('join', { userId: staffUserId, role: 'staff' });
    return () => socket.disconnect();
  }, [staffUserId]);

  const submit = async (e) => {
    e.preventDefault();
    if(!content) return;
    const payload = { staffId, senderId: staffUserId, senderRole: 'staff', content };
    await axios.post(`${import.meta.env.VITE_API_URL}/api/messages`, payload);
    setContent('');
  };

  return (
    <form onSubmit={submit} className="p-4 space-y-2">
      <textarea value={content} onChange={e=>setContent(e.target.value)}
        className="w-full p-2 border rounded" rows={4} placeholder="Describe issue..." />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
    </form>
  );
}
