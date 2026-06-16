# ☁️ CloudCollab Platform — File Sharing & Real-Time Collaboration

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-Auth-4A90D9)

A full-stack file sharing and real-time collaboration platform built with **Node.js**, **Express**, and **Socket.io**. Features user authentication, collaboration rooms, file uploads with multer, and live activity feeds — all powered by a zero-config JSON database.

---

## ✨ Features

- ✅ **User Authentication** — Register/login with bcryptjs-hashed passwords, session-based auth with httpOnly cookies
- ✅ **Collaboration Rooms** — Create, join, and leave rooms; only room creators can delete
- ✅ **File Upload & Management** — Upload files (50 MB limit), download, delete with permission checks
- ✅ **Real-Time Activity Feed** — Socket.io-powered live notifications for uploads, joins, and leaves
- ✅ **JSON Database** — Lowdb stores all data in a local JSON file — no external database setup needed
- ✅ **Responsive UI** — Modern, mobile-friendly interface with tabs and sidebar navigation
- ✅ **Session Management** — Server-side sessions with 24-hour expiry
- ✅ **Room-Aware File Scoping** — Files can be associated with specific collaboration rooms
- ✅ **Zero Configuration** — Clone, install, run — works out of the box

---

## 📸 Screenshot

```
┌─────────────────────────────────────────────────────┐
│  CloudCollab                    [username] [Logout]  │
├──────────┬──────────────────────────────────────────┤
│ Rooms    │  Files                                    │
│          │  ┌──────────────────────────────────────┐ │
│  ○ Design│  │  design-mockup.png  2.3 MB by alice  │ │
│  ○ Dev   │  │  [Download] [Delete]                 │ │
│  ○ Gen   │  ├──────────────────────────────────────┤ │
│          │  │  spec-v2.pdf  1.1 MB by bob          │ │
│ [Create] │  │  [Download] [Delete]                 │ │
│          │  └──────────────────────────────────────┘ │
│          │                                           │
│          │  Activity Feed                            │
│          │  ┌──────────────────────────────────────┐ │
│          │  │ ● alice uploaded design-mockup.png   │ │
│          │  │ ● bob joined the room                │ │
│          │  └──────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

> *Screenshot placeholder — replace with an actual screenshot of the platform.*

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js | JavaScript server runtime |
| **Framework** | Express 4 | HTTP routing and middleware |
| **Real-Time** | Socket.io | WebSocket-based live events |
| **Auth** | bcryptjs | Password hashing |
| **File Upload** | multer | Multipart form data handling |
| **Database** | lowdb | JSON file-based storage (zero config) |
| **Sessions** | In-memory + cookie-parser | httpOnly session cookies |

---

## 🚀 Live Demo

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in your browser
# http://localhost:3000
```

---

## 📁 Project Structure

```
cloud-collab-platform/
├── server.js                 # Express + Socket.io server entry point
├── package.json              # Dependencies and scripts
├── middleware/
│   └── auth.js               # Session management (create, verify, destroy)
├── routes/
│   ├── auth.js               # Register, login, logout, current user
│   ├── files.js              # File upload, list, download, delete
│   └── rooms.js              # Room CRUD, join, leave
├── public/
│   ├── index.html            # Login/register page
│   ├── dashboard.html        # Main dashboard
│   ├── app.js                # Client-side Socket.io logic and UI
│   └── styles.css            # Responsive CSS
├── data/                     # Auto-created at runtime
│   ├── db.json               # Lowdb database (users, files, rooms, messages)
│   └── uploads/              # Uploaded file storage
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/KuroKami2023/cloud-collab-platform.git
cd cloud-collab-platform

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open http://localhost:3000
```

That's it. The `data/` directory and `db.json` are created automatically on first run.

---

## 📖 Usage Guide

### 1. Create an Account
- Open `http://localhost:3000`
- Click the **Register** tab
- Enter a username (min 3 chars) and password (min 6 chars)
- You're automatically logged in and redirected to the dashboard

### 2. Upload Files
- Click **Upload File** from the dashboard
- Select a file (max 50 MB)
- The file appears in the file list with download and delete options
- Activity feed shows the upload event in real time

### 3. Collaboration Rooms
- **Create**: Enter a room name and click **Create**
- **Join**: Click **Join** on any room card
- **Leave**: Click **Leave** on a room you've joined
- **Delete**: Only the room creator can delete a room
- Files can be scoped to specific rooms

### 4. Real-Time Collaboration
- Open multiple browser tabs with different accounts
- File uploads, room joins/leaves appear in the activity feed instantly
- Socket.io events keep all connected clients synchronized

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────┐         ┌───────────────────────────┐ │
│  │  index.html  │         │     dashboard.html         │ │
│  │  (Login/Reg) │         │  ┌─────────────────────┐  │ │
│  └──────────────┘         │  │  app.js (Socket.io)  │  │ │
│                            │  └─────────────────────┘  │ │
│                            └───────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   Express Server                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Middleware   │  │   Routes     │  │  Socket.io    │  │
│  │              │  │              │  │               │  │
│  │  auth        │  │  /auth/*     │  │  join-room    │  │
│  │  cookieParser│  │  /files/*    │  │  leave-room   │  │
│  │  body parser │  │  /rooms/*    │  │  room-message │  │
│  │  static      │  │  /api/status │  │  file-uploaded│  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │            Lowdb JSON Database (data/db.json)         ││
│  │  { users: [], files: [], rooms: [], messages: [] }   ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │   File Storage (data/uploads/)                       ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: User submits credentials → `/auth/login` POST → bcrypt verify → session token created → httpOnly cookie set
2. **File Upload**: User selects file → `multipart/form-data` POST to `/files/upload` → multer saves to disk → record stored in lowdb → Socket.io broadcasts to room
3. **Real-Time Events**: Socket.io connection established → client emits `join-room` → server joins socket to room → all room members receive events

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create account (username >= 3 chars, password >= 6 chars) |
| `POST` | `/auth/login` | No | Login with credentials |
| `POST` | `/auth/logout` | No | Destroy session |
| `GET` | `/auth/me` | Yes | Get current user info |

### Files

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/files/upload` | Yes | Upload file (multipart, max 50 MB) |
| `GET` | `/files` | Yes | List files (`?roomId=` to filter) |
| `GET` | `/files/:id` | Yes | Download file |
| `DELETE` | `/files/:id` | Yes | Delete file (owner only) |

### Rooms

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/rooms` | Yes | Create room |
| `GET` | `/rooms` | Yes | List all rooms with membership status |
| `GET` | `/rooms/:id` | Yes | Get room details + messages |
| `POST` | `/rooms/:id/join` | Yes | Join room |
| `POST` | `/rooms/:id/leave` | Yes | Leave room |
| `DELETE` | `/rooms/:id` | Yes | Delete room (creator only) |

### Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | Join a Socket.io room |
| `leave-room` | Client → Server | Leave a Socket.io room |
| `room-message` | Bidirectional | Send/receive chat messages |
| `file-uploaded` | Bidirectional | Notify room members of new upload |
| `user-joined` | Server → Room | Broadcast when user joins room |
| `user-left` | Server → Room | Broadcast when user leaves room |

---

## 🌐 Deployment

### Render

```bash
# Connect GitHub repository
# Build command: npm install
# Start command: npm start
# Environment: Node
```

### Railway

```bash
railway login
railway up
```

### Fly.io

```bash
fly launch
fly deploy
```

### Heroku

```bash
heroku create
git push heroku main
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Built with ❤️ by <a href="https://github.com/KuroKami2023">KuroKami2023</a></p>
