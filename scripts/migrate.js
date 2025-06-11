const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

console.log('Running Prisma migrations with explicit DATABASE_URL');

// Run prisma migrate deploy with explicit DATABASE_URL
const command = `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing migration: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
  }
  
  console.log(`Migration stdout: ${stdout}`);
  console.log('Migration completed successfully');
}); 