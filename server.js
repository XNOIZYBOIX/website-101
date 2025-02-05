const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store online users
const onlineUsers = new Map(); // Maps WebSocket connections to usernames

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle incoming messages from clients
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'set_username':
        // Add user to online users list
        onlineUsers.set(ws, data.username);
        broadcastOnlineUsers();
        broadcastSystemMessage(`${data.username} has joined the chat.`);
        break;

      case 'message':
        // Broadcast the message to all clients
        const username = onlineUsers.get(ws);
        broadcastMessage(username, data.content);
        break;

      case 'file':
        // Broadcast file to all clients
        const fileUser = onlineUsers.get(ws);
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'file',
              username: fileUser,
              filename: data.filename,
              content: data.content,
              filetype: data.filetype
            }));
          }
        });
        break;

      case 'get_online_users':
        // Send the list of online users to the requesting client
        ws.send(JSON.stringify({
          type: 'online_users',
          users: Array.from(onlineUsers.values()),
        }));
        break;
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    const username = onlineUsers.get(ws);
    if (username) {
      onlineUsers.delete(ws);
      broadcastOnlineUsers();
      broadcastSystemMessage(`${username} has left the chat.`);
    }
    console.log('Client disconnected');
  });
});

// Broadcast online users list to all clients
function broadcastOnlineUsers() {
  const users = Array.from(onlineUsers.values());
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'online_users',
        users: users,
      }));
    }
  });
}

// Broadcast a chat message to all clients
function broadcastMessage(username, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'message',
        username: username,
        message: message,
      }));
    }
  });
}

// Broadcast a system message to all clients
function broadcastSystemMessage(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'system_message',
        message: message,
      }));
    }
  });
}

console.log('WebSocket server is running on ws://localhost:8080');