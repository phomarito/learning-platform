// const mongoose = require('mongoose');

// const connectMongoDB = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform-chats', {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('✅ MongoDB connected for chats');
//     } catch (error) {
//         console.error('❌ MongoDB connection error:', error);
//         process.exit(1);
//     }
// };

// module.exports = connectMongoDB;