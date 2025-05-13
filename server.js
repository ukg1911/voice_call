const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Session middleware
app.use(session({
  secret: 'lawyersecret',
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// Fake user login check
const users = {
  client: 'client123',
  lawyer: 'lawyer123'
};

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.user = username;
    res.redirect('/chat.html');
  } else {
    res.send('Invalid credentials <a href="/">Try again</a>');
  }
});

// Middleware to protect chat
app.get('/chat.html', (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  next();
});

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', ({ roomId, message }) => {
    io.to(roomId).emit('receive_message', message);
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => console.log('Server running at http://localhost:3000'));
