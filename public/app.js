const socket = io();

let currentUser = null;
let currentRoom = null;

async function checkAuth() {
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();
    if (res.ok && data.user) {
      currentUser = data.user;
      document.getElementById('nav-username').textContent = currentUser.username;
      loadFiles();
      loadRooms();
    } else {
      window.location.href = '/';
    }
  } catch (err) {
    window.location.href = '/';
  }
}

function addActivity(message, type = 'info') {
  const feed = document.getElementById('activity-feed');
  const emptyState = feed.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const el = document.createElement('div');
  el.className = `activity-item activity-${type}`;
  el.textContent = message;
  feed.insertBefore(el, feed.firstChild);

  if (feed.children.length > 100) {
    feed.removeChild(feed.lastChild);
  }
}

async function loadFiles(roomId) {
  try {
    const url = roomId ? `/files?roomId=${roomId}` : '/files';
    const res = await fetch(url);
    const data = await res.json();

    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';

    if (!data.files || data.files.length === 0) {
      fileList.innerHTML = '<p class="empty-state">No files in this room.</p>';
      return;
    }

    data.files.forEach((file) => {
      const el = document.createElement('div');
      el.className = 'file-item';
      el.innerHTML = `
        <div class="file-info">
          <span class="file-name">${escapeHtml(file.originalName)}</span>
          <span class="file-meta">${formatSize(file.size)} by ${escapeHtml(file.uploadedByUsername)}</span>
        </div>
        <div class="file-actions">
          <a href="/files/${file.id}" class="btn btn-sm btn-primary" download>Download</a>
          <button class="btn btn-sm btn-danger delete-file" data-id="${file.id}">Delete</button>
        </div>
      `;
      fileList.appendChild(el);
    });

    document.querySelectorAll('.delete-file').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`/files/${id}`, { method: 'DELETE' });
          if (res.ok) {
            loadFiles(currentRoom);
            addActivity('File deleted', 'info');
          }
        } catch (err) {
          console.error('Delete failed:', err);
        }
      });
    });
  } catch (err) {
    console.error('Load files failed:', err);
  }
}

async function loadRooms() {
  try {
    const res = await fetch('/rooms');
    const data = await res.json();
    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';

    if (!data.rooms || data.rooms.length === 0) {
      roomList.innerHTML = '<p class="empty-state">No rooms yet. Create one!</p>';
      return;
    }

    data.rooms.forEach((room) => {
      const el = document.createElement('div');
      el.className = `room-item${currentRoom === room.id ? ' active' : ''}`;
      el.innerHTML = `
        <div class="room-info">
          <span class="room-name">${escapeHtml(room.name)}</span>
          <span class="room-meta">${room.members ? room.members.length : 0} members</span>
        </div>
        <div class="room-actions">
          ${room.isMember
            ? `<button class="btn btn-sm btn-secondary leave-room" data-id="${room.id}">Leave</button>`
            : `<button class="btn btn-sm btn-primary join-room" data-id="${room.id}">Join</button>`
          }
        </div>
      `;
      roomList.appendChild(el);
    });

    document.querySelectorAll('.join-room').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`/rooms/${id}/join`, { method: 'POST' });
          if (res.ok) {
            joinRoom(id);
          }
        } catch (err) {
          console.error('Join room failed:', err);
        }
      });
    });

    document.querySelectorAll('.leave-room').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`/rooms/${id}/leave`, { method: 'POST' });
          if (res.ok) {
            if (currentRoom === id) {
              socket.emit('leave-room', id, currentUser.username);
              currentRoom = null;
            }
            loadRooms();
            loadFiles();
            addActivity('Left room', 'info');
          }
        } catch (err) {
          console.error('Leave room failed:', err);
        }
      });
    });

    document.querySelectorAll('.room-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        const id = item.querySelector('.join-room, .leave-room');
        if (id) {
          const roomId = id.dataset.id;
          const isMember = id.classList.contains('leave-room');
          if (isMember) {
            joinRoom(roomId);
          }
        }
      });
    });
  } catch (err) {
    console.error('Load rooms failed:', err);
  }
}

function joinRoom(roomId) {
  if (currentRoom) {
    socket.emit('leave-room', currentRoom, currentUser.username);
  }
  currentRoom = roomId;
  socket.emit('join-room', roomId, currentUser.username);
  loadFiles(roomId);
  loadRooms();
  addActivity(`Joined room`, 'info');
}

document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  if (currentRoom) {
    formData.append('roomId', currentRoom);
  }

  try {
    const res = await fetch('/files/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      loadFiles(currentRoom);
      addActivity(`${currentUser.username} uploaded ${file.name}`, 'upload');
      socket.emit('file-uploaded', {
        roomId: currentRoom,
        username: currentUser.username,
        filename: file.name,
      });
    } else {
      alert(data.error || 'Upload failed');
    }
  } catch (err) {
    alert('Upload failed. Please try again.');
  }

  e.target.value = '';
});

document.getElementById('create-room-btn').addEventListener('click', async () => {
  const name = document.getElementById('new-room-name').value.trim();
  if (!name) return;

  try {
    const res = await fetch('/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('new-room-name').value = '';
      loadRooms();
      addActivity(`Room "${name}" created`, 'info');
    } else {
      alert(data.error || 'Failed to create room');
    }
  } catch (err) {
    alert('Failed to create room');
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

socket.on('user-joined', (data) => {
  addActivity(`${data.username} joined the room`, 'join');
});

socket.on('user-left', (data) => {
  addActivity(`${data.username} left the room`, 'leave');
});

socket.on('file-uploaded', (data) => {
  addActivity(`${data.username} uploaded ${data.filename}`, 'upload');
  if (currentRoom) {
    loadFiles(currentRoom);
  }
});

socket.on('room-message', (data) => {
  addActivity(`${data.username}: ${data.message}`, 'message');
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

checkAuth();
