const { Server } = require('socket.io');
const cors = require('cors');
const express = require('express');

const app = express();

const allowedOrigins = ['http://localhost:3000', 'https://kns-chat-app.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
}));

const server = require('http').createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'], // Using WebSocket only
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

module.exports = (req, res) => {
  server.listen(4000, () => {
    res.send(`Server running on port 4000`);
  });
};
