const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload a file to Supabase Storage
 * @param {Buffer|Uint8Array} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 * @param {string} userId - The user ID who owns the file
 * @returns {Promise<{path: string, url: string, isLocal: boolean}>} - The path and public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, mimeType, userId) => {
    try {
        console.log('Starting Supabase upload...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Bucket:', bucketName);
        
        // Create a unique path for the file to avoid collisions
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;
        
        console.log('Uploading file to path:', filePath);
        
        // Try to update the bucket to public
        try {
            await supabase.storage.updateBucket(bucketName, {
                public: true
            });
            console.log('Bucket updated to public');
        } catch (updateError) {
            console.log('Could not update bucket, continuing anyway:', updateError);
        }
        
        // Attempt to upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Failed to upload file to Supabase: ${error.message}`);
        }

        console.log('Upload successful, getting public URL...');
        
        // Get the public URL for the file
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file');
        }

        console.log('Public URL:', urlData.publicUrl);
        
        // Test if the URL is actually accessible
        try {
            const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
            if (!response.ok) {
                console.error('URL is not accessible, status:', response.status);
                throw new Error(`URL is not accessible: ${response.status} ${response.statusText}`);
            }
            console.log('URL is accessible, HTTP status:', response.status);
        } catch (fetchError) {
            console.error('Error testing URL accessibility:', fetchError);
            throw new Error('URL verification failed');
        }
        
        return {
            path: filePath,
            url: urlData.publicUrl,
            isLocal: false
        };
    } catch (error) {
        console.error('Error in uploadFile, falling back to local storage:', error);
        
        // Save file locally as a backup
        const localDir = path.join(__dirname, '..', 'uploads', userId);
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const localFileName = `${timestamp}-${sanitizedFileName}`;
        const localPath = path.join(localDir, localFileName);
        
        fs.writeFileSync(localPath, fileBuffer);
        console.log('File saved locally at:', localPath);
        
        // Return local file info - no URL since we'll serve it directly
        return {
            path: null,
            url: null,
            localPath: localPath,
            isLocal: true
        };
    }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            throw new Error(`Failed to delete file from Supabase: ${error.message}`);
        }
    } catch (error) {
        console.error('Error in deleteFile:', error);
        // We'll just log the error and continue
        // since we want to remove the database record anyway
    }
};

module.exports = {
    supabase,
    uploadFile,
    deleteFile
}; 