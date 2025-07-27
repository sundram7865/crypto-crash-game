import express from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { handleSockets } from './websockets/socket.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

// Start Express
const server = app.listen(process.env.PORT, () =>
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`)
);

// Attach Socket.IO to server
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Connect Mongo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Start game loop
handleSockets(io);
