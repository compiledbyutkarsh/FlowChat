const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = {
  general: { name: 'General', description: 'Main chat room', messages: [] },
  tech: { name: 'Tech Talk', description: 'All things technology', messages: [] },
  random: { name: 'Random', description: 'Random conversations', messages: [] },
  gaming: { name: 'Gaming', description: 'Games & entertainment', messages: [] },
};

const users = new Map();
const typingUsers = new Map();

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ username, avatar, color }) => {
    users.set(socket.id, { id: socket.id, username, avatar, color, room: 'general', online: true });
    socket.join('general');

    socket.emit('rooms', Object.entries(rooms).map(([id, r]) => ({
      id, ...r,
      members: [...users.values()].filter(u => u.room === id).length
    })));

    socket.emit('room_history', { room: 'general', messages: rooms['general'].messages.slice(-50) });
    socket.emit('users_list', [...users.values()]);

    io.emit('user_joined', { user: users.get(socket.id), users: [...users.values()] });

    const joinMsg = {
      id: Date.now(), type: 'system',
      text: `${username} joined the chat`,
      timestamp: new Date().toISOString(), room: 'general'
    };
    rooms['general'].messages.push(joinMsg);
    io.to('general').emit('message', joinMsg);
  });

  socket.on('switch_room', (roomId) => {
    const user = users.get(socket.id);
    if (!user || !rooms[roomId]) return;

    socket.leave(user.room);
    user.room = roomId;
    socket.join(roomId);

    socket.emit('room_history', { room: roomId, messages: rooms[roomId].messages.slice(-50) });
    io.emit('users_list', [...users.values()]);
  });

  socket.on('message', ({ text, room, replyTo, image }) => {
    const user = users.get(socket.id);
    if (!user || !rooms[room]) return;

    const msg = {
      id: Date.now() + Math.random(),
      type: 'message',
      text, image, replyTo,
      sender: { id: socket.id, username: user.username, avatar: user.avatar, color: user.color },
      timestamp: new Date().toISOString(),
      room, reactions: {}
    };

    rooms[room].messages.push(msg);
    if (rooms[room].messages.length > 200) rooms[room].messages.shift();

    io.to(room).emit('message', msg);
  });

  socket.on('typing', ({ room, typing }) => {
    const user = users.get(socket.id);
    if (!user) return;
    socket.to(room).emit('typing', { username: user.username, typing });
  });

  socket.on('reaction', ({ msgId, room, emoji }) => {
    const user = users.get(socket.id);
    if (!user) return;
    const msg = rooms[room]?.messages.find(m => m.id === msgId);
    if (!msg) return;
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(socket.id);
    if (idx >= 0) msg.reactions[emoji].splice(idx, 1);
    else msg.reactions[emoji].push(socket.id);
    io.to(room).emit('reaction_update', { msgId, reactions: msg.reactions });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;
    const leaveMsg = {
      id: Date.now(), type: 'system',
      text: `${user.username} left the chat`,
      timestamp: new Date().toISOString(), room: user.room
    };
    if (rooms[user.room]) {
      rooms[user.room].messages.push(leaveMsg);
      io.to(user.room).emit('message', leaveMsg);
    }
    users.delete(socket.id);
    io.emit('users_list', [...users.values()]);
    console.log('User disconnected:', socket.id);
  });
});

app.get('/api/rooms', (req, res) => {
  res.json(Object.entries(rooms).map(([id, r]) => ({
    id, ...r,
    members: [...users.values()].filter(u => u.room === id).length
  })));
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`FlowChat server running on port ${PORT}`));
