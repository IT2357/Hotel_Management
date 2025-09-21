// src/components/MessageThread.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../socket';

export default function MessageThread({ staffId, managerId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(()=> {
    (async ()=> {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/staff/${staffId}`);
      setMessages(res.data);
    })();

    const handler = (msg) => {
      if(String(msg.staffId) === String(staffId)) setMessages(prev => [...prev, msg]);
    };
    socket.on('new_message', handler);
    return ()=> socket.off('new_message', handler);
  }, [staffId]);

  async function sendReply(e) {
    e.preventDefault();
    if(!text) return;
    const payload = { staffId, senderId: managerId, senderRole: 'manager', content: text };
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/messages`, payload);
    setText('');
    // message will arrive via socket too and be appended
  }

  return (
    <div>
      <div className="h-96 overflow-auto border p-2 space-y-2">
        {messages.map(m => (
          <div key={m._id} className={m.senderRole === 'manager' ? 'text-right' : 'text-left'}>
            <div className="inline-block p-2 rounded-md bg-gray-100">{m.content}</div>
            <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendReply} className="mt-2 flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Reply..." />
        <button className="bg-green-600 text-white px-4 rounded">Send</button>
      </form>
    </div>
  );
}
