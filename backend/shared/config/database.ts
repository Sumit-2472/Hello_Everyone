import mongoose from 'mongoose';

let isConnected = false;

export const connectDatabase = async (serviceName: string): Promise<void> => {
  if (isConnected) {
    console.log(`[${serviceName}] Reusing existing MongoDB connection`);
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(uri, {
      // Each service uses its own DB name via the URI path
      dbName: process.env.DB_NAME || serviceName.toLowerCase().replace('-', '_'),
    });

    isConnected = true;
    console.log(`[${serviceName}] Connected to MongoDB`);

    mongoose.connection.on('error', (err) => {
      console.error(`[${serviceName}] MongoDB connection error:`, err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[${serviceName}] MongoDB disconnected`);
      isConnected = false;
    });
  } catch (error) {
    console.error(`[${serviceName}] Failed to connect to MongoDB:`, error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};
