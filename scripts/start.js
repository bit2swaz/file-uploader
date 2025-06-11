const { spawn } = require('child_process');
const { execSync } = require('child_process');

// Debug environment variables
console.log('Environment variables available:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('RAILWAY_STATIC_URL:', process.env.RAILWAY_STATIC_URL);
console.log('RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME);

// Check Railway variables
if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL is missing. Checking Railway environment...');
  
  try {
    // Try to find the Railway PostgreSQL URL if running in Railway
    if (process.env.RAILWAY_SERVICE_NAME) {
      console.log('Running in Railway, trying to detect PostgreSQL URL...');
      
      // List all environment variables (for debugging)
      console.log('All environment variables:');
      Object.keys(process.env).forEach(key => {
        if (key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('DB_')) {
          console.log(`${key}: [exists]`);
        }
      });
      
      // Try to run the app even without DATABASE_URL
      console.log('Attempting to start the application anyway...');
    }
  } catch (error) {
    console.error('Error checking environment:', error);
  }
}

// Start the application
console.log('Starting application...');
const app = spawn('node', ['app.js'], { stdio: 'inherit' });

app.on('close', (code) => {
  console.log(`Application process exited with code ${code}`);
  process.exit(code);
});