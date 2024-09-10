const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const allowedOrigins = ['http://localhost:3000', 'https://kns-chat-app.vercel.app'];

app.use(cors({
  origin: ['http://localhost:3000', 'https://kns-chat-app.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://kns-chat-app.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'], // Explicitly specify WebSocket transport
});


io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('message', (payload) => {
    io.emit('message', payload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
