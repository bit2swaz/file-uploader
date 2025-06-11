/**
 * This script migrates existing local files to Supabase storage
 * Run with: node scripts/migrate-to-supabase.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { uploadFile } = require('../config/supabase');
require('dotenv').config();

const prisma = new PrismaClient();

const migrateFiles = async () => {
    try {
        console.log('Starting migration of local files to Supabase...');
        
        // Get all files that don't have a Supabase URL yet
        const files = await prisma.file.findMany({
            where: {
                path: { not: null },
                OR: [
                    { url: null },
                    { storagePath: null }
                ]
            },
            include: {
                user: true
            }
        });
        
        console.log(`Found ${files.length} files to migrate`);
        
        for (const file of files) {
            try {
                console.log(`Migrating ${file.filename} (ID: ${file.id})...`);
                
                // Check if the file exists
                const fileExists = await fs.access(file.path)
                    .then(() => true)
                    .catch(() => false);
                
                if (!fileExists) {
                    console.error(`File not found on disk: ${file.path}`);
                    continue;
                }
                
                // Read the file
                const fileBuffer = await fs.readFile(file.path);
                
                // Upload to Supabase
                const { path: storagePath, url } = await uploadFile(
                    fileBuffer,
                    file.filename,
                    file.mimetype,
                    file.userId
                );
                
                // Update the database record
                await prisma.file.update({
                    where: { id: file.id },
                    data: {
                        storagePath,
                        url
                    }
                });
                
                console.log(`Successfully migrated ${file.filename} to Supabase`);
                console.log(`Storage Path: ${storagePath}`);
                console.log(`URL: ${url}`);
                
                // Optionally delete the local file
                // await fs.unlink(file.path);
                // console.log(`Deleted local file: ${file.path}`);
                
            } catch (error) {
                console.error(`Error migrating file ${file.id}:`, error);
            }
        }
        
        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
};

migrateFiles(); 