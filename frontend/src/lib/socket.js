// import { io } from 'socket.io-client';

// class SocketService {
//   constructor() {
//     this.socket = null;
//     this.token = null;
//     this.listeners = new Map();
//   }

//   connect(token) {
//     if (this.socket) {
//       this.disconnect();
//     }

//     this.token = token;

//     // Используем явный URL
//     this.socket = io('http://localhost:3000', {
//       auth: { token },
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       withCredentials: true
//     });

//     this.socket.on('connect', () => {
//       console.log('✅ Socket connected');
//     });

//     this.socket.on('disconnect', (reason) => {
//       console.log('❌ Socket disconnected:', reason);
//     });

//     this.socket.on('connect_error', (error) => {
//       console.error('⚠️ Socket connection error:', error);
//     });

//     this.setupGlobalHandlers();
//     return this.socket;
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//     }
//     this.listeners.clear();
//   }

//   setupGlobalHandlers() {
//     if (!this.socket) return;

//     this.socket.on('new-message', (message) => {
//       this.emitToListeners('new-message', message);
//     });

//     this.socket.on('message-read', (data) => {
//       this.emitToListeners('message-read', data);
//     });

//     this.socket.on('user-online', (userId) => {
//       this.emitToListeners('user-online', userId);
//     });

//     this.socket.on('user-offline', (userId) => {
//       this.emitToListeners('user-offline', userId);
//     });
//   }

//   on(event, callback) {
//     if (!this.listeners.has(event)) {
//       this.listeners.set(event, []);
//     }
//     this.listeners.get(event).push(callback);
//   }

//   off(event, callback) {
//     if (this.listeners.has(event)) {
//       const callbacks = this.listeners.get(event);
//       const index = callbacks.indexOf(callback);
//       if (index > -1) {
//         callbacks.splice(index, 1);
//       }
//     }
//   }

//   emitToListeners(event, data) {
//     if (this.listeners.has(event)) {
//       this.listeners.get(event).forEach(callback => callback(data));
//     }
//   }

//   emit(event, data) {
//     if (this.socket) {
//       this.socket.emit(event, data);
//     }
//   }

//   joinChatRoom(chatId) {
//     if (this.socket) {
//       this.socket.emit('join-room', chatId);
//     }
//   }

//   leaveChatRoom(chatId) {
//     if (this.socket) {
//       this.socket.emit('leave-room', chatId);
//     }
//   }

//   sendMessage(chatId, content) {
//     if (this.socket) {
//       this.socket.emit('chat-message', { roomId: chatId, content });
//       return true;
//     }
//     return false;
//   }

//   markAsRead(chatId, messageId) {
//     if (this.socket) {
//       this.socket.emit('mark-read', { chatId, messageId });
//     }
//   }

//   getSocket() {
//     return this.socket;
//   }

//   isConnected() {
//     return this.socket?.connected || false;
//   }
// }

// export default new SocketService();