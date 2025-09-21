// src/components/ManagerInbox.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '.../service/socket';
import MessageThread from './MessageThread';

export default function ManagerInbox({ managerId }) {
  const [allMsgs, setAllMsgs] = useState([]);
  const [staffList, setStaffList] = useState([]); // unique staff ids
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(()=> {
    socket.connect();
    socket.emit('join', { userId: managerId, role: 'manager' });

    socket.on('new_message', (msg) => {
      setAllMsgs(prev => [msg, ...prev]);
    });

    fetchAll();
    return () => socket.off('new_message');
  }, []);

  async function fetchAll() {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages`);
    setAllMsgs(res.data);
    const uniques = [...new Map(res.data.map(m => [String(m.staffId), m])).values()];
    setStaffList(uniques);
  }

  // pick staff -> show MessageThread
  return (
    <div className="flex">
      <aside className="w-80 border-r p-2">
        <h2 className="font-bold mb-2">Staffs</h2>
        {staffList.map(s => (
          <div key={s._id} onClick={()=>setSelectedStaff(s.staffId)} className="p-2 border-b cursor-pointer">
            <div className="text-sm">Staff ID: {s.staffId}</div>
            <div className="text-xs text-gray-500">{s.content.slice(0,60)}</div>
          </div>
        ))}
      </aside>

      <main className="flex-1 p-4">
        {selectedStaff ? <MessageThread staffId={selectedStaff} managerId={managerId} /> : <div>Select a staff</div>}
      </main>
    </div>
  );
}
