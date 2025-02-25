// WebSocket connection
const ws = new WebSocket('ws://localhost:8080'); // Updated to local WebSocket server

// Online users tracking
let onlineUsers = 0;
const onlineCountElement = document.getElementById('online-count');
const nicknameDisplay = document.getElementById('nickname-display');

// Update online users display
function updateOnlineUsers(count) {
  onlineUsers = count;
  onlineCountElement.textContent = count;
}

// Function to update the online users list
function updateUserList(users) {
  const userList = users.map(user => `<div class="user">${user}</div>`).join('');
  nicknameDisplay.innerHTML = `<h2>Online Users (${users.length})</h2>${userList}`;
}

// Function to add a system message to the chat window
function addSystemMessage(text) {
  const messageElement = document.createElement('div');
  messageElement.className = 'system-message';
  messageElement.textContent = text;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to the bottom
}

// Request online users count every 10 seconds
setInterval(() => {
  ws.send(JSON.stringify({ type: 'get_online_users' }));
}, 10000);

// Handle online users response
function handleOnlineUsers(data) {
  updateOnlineUsers(data.count);
}

// DOM Elements
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-button');
const nicknameModal = document.getElementById('nickname-modal');
const nicknameInput = document.getElementById('nickname-input');
const startChatButton = document.getElementById('start-chat');
const chatContainer = document.getElementById('chat-container');

// Handle nickname submission
startChatButton.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim();
  if (nickname) {
    // Set username immediately on connection
    ws.send(JSON.stringify({
      type: 'set_username',
      username: nickname
    }));
    
    nicknameModal.style.display = 'none';
    chatContainer.style.display = 'block';
    ws.usernameSet = true;
  }
});

// Handle incoming WebSocket messages
ws.onmessage = function (event) {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'message':
      addMessage(data.username, data.message);
      break;

    case 'online_users':
      updateUserList(data.users);
      break;

    case 'system_message':
      addSystemMessage(data.message);
      break;

    default:
      console.warn('Unknown message type:', data.type);
  }
};

// Function to add a message to the chat window
function addMessage(nickname, message) {
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${nickname}:</strong> ${message}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to send a message
function sendMessage() {
  const nickname = nicknameInput.value.trim();
  const message = messageInput.value.trim();

  if (nickname && message) {
    // Set username on first message
    if (!ws.usernameSet) {
      ws.send(JSON.stringify({
        type: 'set_username',
        username: nickname
      }));
      ws.usernameSet = true;
    }

    // Send message to WebSocket server
    ws.send(JSON.stringify({
      type: 'message',
      content: message
    }));
    
    messageInput.value = '';
  }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});