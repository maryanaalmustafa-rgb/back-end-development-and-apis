
import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const PORT = 3001;

// Create HTTP server
const server = http.createServer((req, res) => {
  fs.readFile('./public/index.html', (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading page');
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Handle new connections
wss.on('connection', (socket, req) => {
  const username = new URL(req.url, "http://localhost").searchParams.get(
    "username",
  );

  // Broadcast join message
  const joinMessage = JSON.stringify({
    type: 'system',
    text: `${username} joined`
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(joinMessage);
    }
  });

  // Handle incoming messages
  socket.on('message', (message) => {
    const { username, text } = JSON.parse(message);

    const chatMessage = JSON.stringify({
      type: 'chat',
      username,
      text
    });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(chatMessage);
      }
    });
  });

  // Handle disconnection
  socket.on('close', () => {
    const leaveMessage = JSON.stringify({
      type: 'system',
      text: `${username} left`
    });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(leaveMessage);
      }
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log('Chat server running at http://localhost:3001');
});
