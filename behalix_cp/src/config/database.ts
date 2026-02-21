import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Cache connection for serverless (avoids reconnecting on every cold start)
const cached = (global as any)._mongooseCache || { conn: null, promise: null };
(global as any)._mongooseCache = cached;

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI || '');
  }

  try {
    cached.conn = await cached.promise;
    console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`Error: ${(error as Error).message}`);
    throw error;
  }
};

export default connectDB;
