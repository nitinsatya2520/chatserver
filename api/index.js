const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://kns-chat-app.vercel.app'],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
  },
});

// Define allowed origins
const allowedOrigins = ['http://localhost:3000', 'https://kns-chat-app.vercel.app'];

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Set up PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://default:ore8uT4Oclqm@ep-billowing-union-a43tqmqf.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
  ssl: {
    rejectUnauthorized: false,
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

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// WebSocket connection for real-time features
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', data);
  });

  socket.on('stoppedTyping', (data) => {
    socket.broadcast.emit('userStoppedTyping', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Endpoint to get messages
app.get('/messages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM messages ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Server Error');
  }
});

// Endpoint to post a new message
app.post('/messages', async (req, res) => {
  const { sender, recipient, content } = req.body;
  if (!sender || !recipient || !content) {
    return res.status(400).send('Sender, recipient, and content are required');
  }

  try {
    await pool.query('INSERT INTO messages(sender, recipient, content, reactions) VALUES($1, $2, $3, $4)', 
    [sender, recipient, content, JSON.stringify({})]);
    
    io.emit('newMessage', { sender, recipient, content });
    res.status(201).send('Message created');
  } catch (err) {
    console.error('Error saving message to PostgreSQL:', err);
    res.status(500).send('Server Error');
  }
});

// Endpoint to delete messages for a user
app.post('/leave-chat', async (req, res) => {
  const { sender } = req.body;
  if (!sender) {
    return res.status(400).send('Sender is required');
  }

  try {
    await pool.query('DELETE FROM messages WHERE sender = $1', [sender]);
    res.status(200).send('Messages deleted');
  } catch (err) {
    console.error('Error deleting messages:', err);
    res.status(500).send('Server Error');
  }
});

// File Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

// Endpoint to add reactions to messages
app.post('/messages/:id/reaction', async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;

  try {
    await pool.query(
      "UPDATE messages SET reactions = jsonb_set(reactions, '{likes}', (COALESCE(reactions->>'likes', '0')::int + 1)::text::jsonb, true) WHERE id = $1",
      [id]
    );
    io.emit('messageReaction', { id, emoji });
    res.status(200).send('Reaction added');
  } catch (err) {
    console.error('Error adding reaction:', err);
    res.status(500).send('Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket Connection for Video Call
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle call initiation
  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('callUser', { signal: signalData, from, name });
  });

  // Answer the call
  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});