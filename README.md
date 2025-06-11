# File Uploader

A modern, secure file management system with cloud storage integration and shareable links.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js with session-based auth
- **Storage**: Hybrid approach - Supabase Cloud Storage with local fallback
- **Frontend**: EJS templates, custom CSS, vanilla JavaScript

## Features

- **User Authentication**
  - Secure login/register with password hashing
  - Session-based authentication using PostgreSQL session store

- **File Management**
  - Create and organize folders
  - Upload files to specific folders
  - View detailed file information
  - Secure file downloads

- **Cloud Storage Integration**
  - Primary storage on Supabase Cloud
  - Automatic fallback to local storage when cloud is unavailable
  - Seamless download experience regardless of storage location

- **Folder Sharing**
  - Generate secure, time-limited share links for folders
  - JWT-based authentication for shared links
  - Configurable expiration periods (1 hour to 30 days)
  - Read-only access for shared content

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- PostgreSQL database
- Supabase account (for cloud storage)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/bit2swaz/file-uploader.git
   cd file-uploader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the project root
   - Use the `.env.example` as a template
   - Fill in your database and Supabase credentials

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Deployment

The application is deployed at: [https://your-app.railway.app](https://your-app.railway.app)

For production deployment:
1. Ensure all environment variables are properly set
2. Configure database connection strings for production
3. Set `NODE_ENV=production`

## License

MIT