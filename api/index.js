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

let server = require('http').createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Allow polling as fallback
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
  if (!server.listening) {
    server.listen(4000, () => {
      console.log('Server running on port 4000');
    });
  }
  res.status(200).send('Socket.IO Server is running.');
};
