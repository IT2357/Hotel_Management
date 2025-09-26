import { io } from 'socket.io-client';
const URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';
export const socket = io(URL, { autoConnect: false });
