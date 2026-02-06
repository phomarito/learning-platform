// const mongoose = require('mongoose');

// const participantSchema = new mongoose.Schema({
//     userId: {
//         type: Number,
//         required: true
//     },
//     name: String,
//     avatar: String,
//     role: String,
//     joinedAt: {
//         type: Date,
//         default: Date.now
//     },
//     lastSeen: Date
// });

// const chatSchema = new mongoose.Schema({
//     _id: {
//         type: String,
//         default: () => new mongoose.Types.ObjectId().toString()
//     },
//     name: {
//         type: String,
//         required: true,
//         default: 'Новый чат'
//     },
//     isGroup: {
//         type: Boolean,
//         default: false
//     },
//     participants: [participantSchema],
//     creatorId: {
//         type: Number,
//         required: true
//     },
//     lastMessage: String,
//     lastMessageAt: {
//         type: Date,
//         default: Date.now
//     },
//     messageCount: {
//         type: Number,
//         default: 0
//     },
//     unreadCounts: {
//         type: Map,
//         of: Number,
//         default: {}
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

// chatSchema.index({ 'participants.userId': 1, lastMessageAt: -1 });
// chatSchema.index({ isGroup: 1, lastMessageAt: -1 });
// chatSchema.index({ creatorId: 1 });

// module.exports = mongoose.model('Chat', chatSchema);