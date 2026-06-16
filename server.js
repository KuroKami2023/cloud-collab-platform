const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

db.defaults({
  users: [],
  files: [],
  rooms: [],
  messages: [],
}).write();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  req.uploadsDir = UPLOADS_DIR;
  next();
});

app.use('/auth', authRoutes);
app.use('/files', fileRoutes);
app.use('/rooms', roomRoutes);

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime() });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', {
      username,
      timestamp: new Date().toISOString(),
    });
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId, username) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', {
      username,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('room-message', (data) => {
    const { roomId, username, message } = data;
    io.to(roomId).emit('room-message', {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
    db.get('messages').push({
      roomId,
      username,
      message,
      timestamp: new Date().toISOString(),
    }).write();
  });

  socket.on('file-uploaded', (data) => {
    const { roomId, username, filename } = data;
    if (roomId) {
      io.to(roomId).emit('file-uploaded', {
        username,
        filename,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Cloud Collaboration Platform running on http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

module.exports = { app, server, io, db };
