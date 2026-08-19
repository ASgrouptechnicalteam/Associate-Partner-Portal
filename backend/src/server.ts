import dotenv from 'dotenv';
import path from 'path';

// Load backend environment variables.
// Local development: backend/.env
// Render production: environment variables configured in Render.
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

import app from './app';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();