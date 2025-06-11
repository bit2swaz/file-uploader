# File Uploader

A file upload and management application with folder organization and cloud storage.

## Features

- User authentication with Passport.js
- File upload to Supabase cloud storage
- File organization with folders
- Secure file downloading
- File details view

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/file_uploader?schema=public"
   SESSION_SECRET="your-super-secret-key"
   PORT=3000
   SUPABASE_URL="https://your-supabase-project-url.supabase.co"
   SUPABASE_KEY="your-supabase-anon-key"
   SUPABASE_BUCKET="file-uploader-bucket"
   ```

3. Set up the PostgreSQL database:
   ```
   npx prisma migrate dev
   ```

4. Set up Supabase:
   - Create a Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Create a storage bucket named `file-uploader-bucket` with public access
   - Copy your Supabase URL and anon key to the `.env` file

5. Start the application:
   ```
   npm run dev
   ```

## Migrating Existing Files

If you need to migrate existing files from local storage to Supabase:

```
node scripts/migrate-to-supabase.js
```

## License

MIT