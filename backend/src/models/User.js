import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: String, // Clerk user ID
  username: String,
  wallet: {
    BTC: { type: Number, default: 0 },
    ETH: { type: Number, default: 0 }
  }
});

export default mongoose.model('User', userSchema);
