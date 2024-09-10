const express = require('express');
const http = require('http');
const cors = require('cors');
const { Pool } = require('@vercel/postgres'); // Import Vercel Postgres Pool

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

// Set up PostgreSQL connection pool using Vercel Postgres
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

// Define routes
app.get('/messages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM messages');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Server Error');
  }
});

// Initialize Socket.IO
const io = require('socket.io')(server, {
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
