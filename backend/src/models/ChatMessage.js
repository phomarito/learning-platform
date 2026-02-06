// const mongoose = require('mongoose');

// const chatMessageSchema = new mongoose.Schema({
//     _id: {
//         type: String,
//         default: () => new mongoose.Types.ObjectId().toString()
//     },
//     chatId: {
//         type: String,
//         index: true
//     },
//     sessionId: {
//         type: String,
//         index: true
//     },
//     content: {
//         type: String,
//         required: true
//     },
//     type: {
//         type: String,
//         enum: ['text', 'image', 'file', 'quiz', 'system'],
//         default: 'text'
//     },
//     senderId: {
//         type: String,
//         required: true,
//         index: true
//     },
//     senderName: String,
//     senderAvatar: String,
//     userId: {
//         type: Number,
//         index: true
//     },
//     isAI: {
//         type: Boolean,
//         default: false
//     },
//     metadata: {
//         type: mongoose.Schema.Types.Mixed,
//         default: {}
//     },
//     status: {
//         type: String,
//         enum: ['sending', 'sent', 'delivered', 'read', 'error'],
//         default: 'sent'
//     },
//     deletedAt: Date,
//     deletedBy: Number
// }, {
//     timestamps: true
// });

// chatMessageSchema.index({ chatId: 1, createdAt: 1 });
// chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
// chatMessageSchema.index({ createdAt: -1 });
// chatMessageSchema.index({ senderId: 1, createdAt: -1 });

// // TTL индекс для автоматического удаления старых сообщений (90 дней)
// chatMessageSchema.index({ createdAt: 1 }, { 
//     expireAfterSeconds: 90 * 24 * 60 * 60 
// });

// module.exports = mongoose.model('ChatMessage', chatMessageSchema);