const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://kns-chat-app.vercel.app/',  // Replace with your actual client origin in production
    methods: ['GET', 'POST'],
  }
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
}));

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('message', (payload) => {
    io.emit('message', payload); // Broadcast message
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(4000, () => {
  console.log('Server running on port 4000');
});
