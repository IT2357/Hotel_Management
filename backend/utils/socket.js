import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:4173",
  ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Socket.io connection handler for food workflow
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join room based on user role (sent from client)
    socket.on('join-role-room', (data) => {
      const { role, userId } = data;
      
      // Join food-specific rooms based on role
      if (role === 'manager' || role === 'admin') {
        socket.join('food-manager');
        console.log(`User ${userId} joined food-manager room`);
      }
      
      if (role === 'staff' || role === 'manager' || role === 'admin') {
        socket.join('food-kitchen');
        socket.join(`staff-${userId}`);
        console.log(`User ${userId} joined food-kitchen room`);
      }
      
      if (role === 'guest' || userId) {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined user room`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
