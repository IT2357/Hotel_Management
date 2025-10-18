import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST']
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
