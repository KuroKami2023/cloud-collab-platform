const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = req.uploadsDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${generateId()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  const db = req.db;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileRecord = {
    id: generateId(),
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedBy: req.user.userId,
    uploadedByUsername: req.user.username,
    uploadedAt: new Date().toISOString(),
    roomId: req.body.roomId || null,
  };

  db.get('files').push(fileRecord).write();

  const io = req.io;
  if (fileRecord.roomId) {
    io.to(fileRecord.roomId).emit('file-uploaded', {
      username: req.user.username,
      filename: req.file.originalname,
      timestamp: fileRecord.uploadedAt,
    });
  }

  res.status(201).json({
    message: 'File uploaded successfully',
    file: fileRecord,
  });
});

router.get('/', requireAuth, (req, res) => {
  const db = req.db;
  const { roomId } = req.query;

  let files = db.get('files').value();

  if (roomId) {
    files = files.filter((f) => f.roomId === roomId);
  }

  res.json({ files });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = req.db;
  const file = db.get('files').find({ id: req.params.id }).value();

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(req.uploadsDir, file.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File data not found on disk' });
  }

  res.download(filePath, file.originalName);
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = req.db;
  const file = db.get('files').find({ id: req.params.id }).value();

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (file.uploadedBy !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to delete this file' });
  }

  const filePath = path.join(req.uploadsDir, file.storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.get('files').remove({ id: req.params.id }).write();

  res.json({ message: 'File deleted successfully' });
});

module.exports = router;
