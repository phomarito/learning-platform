// const mongoose = require('mongoose');

// const chatSessionSchema = new mongoose.Schema({
//     _id: {
//         type: String,
//         default: () => new mongoose.Types.ObjectId().toString()
//     },
//     title: {
//         type: String,
//         required: true,
//         default: 'Новый чат'
//     },
//     context: {
//         type: String,
//         enum: ['course', 'quiz', 'simulation', 'general'],
//         default: 'general'
//     },
//     userId: {
//         type: Number,
//         required: true,
//         index: true
//     },
//     userName: String,
//     userAvatar: String,
//     lastMessage: String,
//     lastMessageAt: {
//         type: Date,
//         default: Date.now
//     },
//     messageCount: {
//         type: Number,
//         default: 0
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     metadata: {
//         type: mongoose.Schema.Types.Mixed,
//         default: {}
//     }
// }, {
//     timestamps: true
// });

// chatSessionSchema.index({ userId: 1, createdAt: -1 });
// chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });
// chatSessionSchema.index({ context: 1 });

// module.exports = mongoose.model('ChatSession', chatSessionSchema);