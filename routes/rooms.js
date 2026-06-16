const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

function generateId() {
  let id = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

router.post('/', requireAuth, (req, res) => {
  const db = req.db;
  const { name, description } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  const room = {
    id: generateId(),
    name: name.trim(),
    description: description || '',
    createdBy: req.user.userId,
    createdByUsername: req.user.username,
    createdAt: new Date().toISOString(),
    members: [req.user.username],
  };

  db.get('rooms').push(room).write();

  res.status(201).json({
    message: 'Room created successfully',
    room,
  });
});

router.get('/', requireAuth, (req, res) => {
  const db = req.db;
  const rooms = db.get('rooms').value();

  const roomsWithMemberStatus = rooms.map((room) => ({
    ...room,
    isMember: room.members.includes(req.user.username),
  }));

  res.json({ rooms: roomsWithMemberStatus });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = req.db;
  const room = db.get('rooms').find({ id: req.params.id }).value();

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const messages = db.get('messages').filter({ roomId: req.params.id }).value();

  res.json({ room, messages });
});

router.post('/:id/join', requireAuth, (req, res) => {
  const db = req.db;
  const room = db.get('rooms').find({ id: req.params.id }).value();

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!room.members.includes(req.user.username)) {
    room.members.push(req.user.username);
    db.get('rooms').find({ id: req.params.id }).assign({ members: room.members }).write();
  }

  const io = req.io;
  io.to(req.params.id).emit('user-joined', {
    username: req.user.username,
    timestamp: new Date().toISOString(),
  });

  res.json({
    message: 'Joined room successfully',
    room,
  });
});

router.post('/:id/leave', requireAuth, (req, res) => {
  const db = req.db;
  const room = db.get('rooms').find({ id: req.params.id }).value();

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  room.members = room.members.filter((m) => m !== req.user.username);
  db.get('rooms').find({ id: req.params.id }).assign({ members: room.members }).write();

  const io = req.io;
  io.to(req.params.id).emit('user-left', {
    username: req.user.username,
    timestamp: new Date().toISOString(),
  });

  res.json({ message: 'Left room successfully' });
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = req.db;
  const room = db.get('rooms').find({ id: req.params.id }).value();

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.createdBy !== req.user.userId) {
    return res.status(403).json({ error: 'Only the room creator can delete the room' });
  }

  db.get('messages').remove({ roomId: req.params.id }).write();
  db.get('rooms').remove({ id: req.params.id }).write();

  res.json({ message: 'Room deleted successfully' });
});

module.exports = router;
