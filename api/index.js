const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg'); // Import pg Pool for PostgreSQL

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = ['http://localhost:3000', 'https://kns-chat-app.vercel.app'];

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Set up PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://default:ore8uT4Oclqm@ep-billowing-union-a43tqmqf.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
  ssl: {
    rejectUnauthorized: false, // Set to true if your database requires SSL
  },
});

// Test PostgreSQL connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected:', res.rows[0]);
  }
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Store message in PostgreSQL
  socket.on('message', async (payload) => {
    try {
      // Insert message into database
      await pool.query('INSERT INTO messages(username, message) VALUES($1, $2)', [payload.username, payload.message]);
      io.emit('message', payload);
    } catch (err) {
      console.error('Error saving message to PostgreSQL:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
