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

// Middleware to parse JSON bodies
app.use(express.json());

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
    await pool.query('INSERT INTO messages(sender, recipient, content) VALUES($1, $2, $3)', [sender, recipient, content]);
    res.status(201).send('Message created');
  } catch (err) {
    console.error('Error saving message to PostgreSQL:', err);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
