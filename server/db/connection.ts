import mongoose from 'mongoose';

let isConnected = false;
let currentUri = process.env.MONGODB_URI || '';

export async function connectDB(customUri?: string): Promise<boolean> {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutrack';

  try {
    if (mongoose.connection.readyState === 1 && currentUri === uri) {
      isConnected = true;
      return true;
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }

    console.log(`[EduTrack Database] Connecting to MongoDB (${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')})...`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout so server startup is instantaneous
    });

    isConnected = true;
    currentUri = uri;
    console.log('[EduTrack Database] Successfully connected to MongoDB via Mongoose.');
    return true;
  } catch (error) {
    isConnected = false;
    currentUri = uri;
    console.warn(
      '[EduTrack Database] MongoDB server connection standby (URI: %s). Operating in autonomous dual-store mode: changes persisted to disk and queued for MongoDB sync.',
      uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    );
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDbConnectionInfo() {
  return {
    connected: isDbConnected(),
    uri: currentUri ? currentUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'mongodb://127.0.0.1:27017/edutrack',
    host: mongoose.connection.host || '127.0.0.1',
    name: mongoose.connection.name || 'edutrack',
    readyState: mongoose.connection.readyState
  };
}
