const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow both localhost and production URL for CORS
const allowedOrigins = ['http://localhost:3000', 'https://kns-chat-app.vercel.app'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
}));

io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('message', (payload) => {
    io.emit('message', payload); // Broadcast message to all users
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Ensure server listens on PORT from environment variables (for Vercel) or fallback to port 4000
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
