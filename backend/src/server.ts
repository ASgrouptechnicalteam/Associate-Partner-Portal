import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import app from './app';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
