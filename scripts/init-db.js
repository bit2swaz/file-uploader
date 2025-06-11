const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get the DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Function to parse the DATABASE_URL into connection options
function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port,
      database: url.pathname.substring(1),
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Failed to parse connection string:', error);
    throw error;
  }
}

async function initializeDatabase() {
  console.log('Initializing database directly via SQL...');
  
  try {
    // Parse the connection string
    const connectionOptions = parseConnectionString(databaseUrl);
    
    // Create a new pool
    const pool = new Pool(connectionOptions);
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'prisma', 'migration.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL script
    await pool.query(sqlScript);
    
    console.log('Database schema initialized successfully');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 