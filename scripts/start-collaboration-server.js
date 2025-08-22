const { WebSocketServer } = require('ws');

console.log('Starting collaboration WebSocket server...');

const wss = new WebSocketServer({ port: 3001 });

// Store connected users by folderz
const rooms = new Map();

wss.on('connection', (ws, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const folderId = url.searchParams.get('folderId');
  const userId = url.searchParams.get('userId');
  const userName = url.searchParams.get('userName');

  if (!folderId || !userId || !userName) {
    ws.close(1008, 'Missing required parameters');
    return;
  }

  console.log(`User ${userName} (${userId}) joined folder ${folderId}`);

  // Add user to room
  if (!rooms.has(folderId)) {
    rooms.set(folderId, new Set());
  }
  const room = rooms.get(folderId);
  const user = { ws, userId, userName, folderId };
  room.add(user);

  // Notify others in the room
  broadcastToRoom(folderId, {
    type: 'presence',
    folderId,
    userId: user.userId,
    userName: user.userName,
    data: { action: 'joined' }
  }, user.userId);

  // Send current room state to new user
  const roomUsers = Array.from(room).map(u => ({
    userId: u.userId,
    userName: u.userName
  }));
  ws.send(JSON.stringify({
    type: 'presence',
    folderId,
    userId: user.userId,
    userName: user.userName,
    data: { action: 'room_state', users: roomUsers }
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message.type, 'from', message.userName);
      
      // Broadcast to others in the room
      broadcastToRoom(folderId, message, user.userId);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`User ${userName} left folder ${folderId} (code: ${ws.closeCode}, reason: ${ws.closeReason})`);
    leaveRoom(folderId, user);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${userName} in folder ${folderId}:`, error.message);
    leaveRoom(folderId, user);
  });
});

function leaveRoom(folderId, user) {
  const room = rooms.get(folderId);
  if (room) {
    room.delete(user);
    if (room.size === 0) {
      rooms.delete(folderId);
    } else {
      // Notify others that user left
      broadcastToRoom(folderId, {
        type: 'presence',
        folderId,
        userId: user.userId,
        userName: user.userName,
        data: { action: 'left' }
      }, user.userId);
    }
  }
}

function broadcastToRoom(folderId, message, excludeUserId) {
  const room = rooms.get(folderId);
  if (room) {
    room.forEach(user => {
      if (user.userId !== excludeUserId && user.ws.readyState === 1) { // WebSocket.OPEN
        user.ws.send(JSON.stringify(message));
      }
    });
  }
}

console.log('Collaboration server started on port 3001');
console.log('Press Ctrl+C to stop the server');

process.on('SIGINT', () => {
  console.log('\nShutting down collaboration server...');
  wss.close();
  process.exit(0);
}); 