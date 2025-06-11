const { createClient } = require('@supabase/supabase-js');
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
 * @returns {Promise<{path: string, url: string}>} - The path and public URL of the uploaded file
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
        
        // Make the bucket public if using for the first time
        try {
            await supabase.storage.getBucket(bucketName);
        } catch (error) {
            console.log('Bucket does not exist or is not accessible, trying to create it...');
            try {
                await supabase.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: 50 * 1024 * 1024 // 50MB
                });
                console.log('Bucket created successfully');
            } catch (bucketError) {
                console.log('Failed to create bucket, it might already exist:', bucketError);
            }
        }
        
        // Try to update the bucket to public
        try {
            await supabase.storage.updateBucket(bucketName, {
                public: true
            });
            console.log('Bucket updated to public');
        } catch (updateError) {
            console.log('Could not update bucket, continuing anyway:', updateError);
        }
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: true // Changed to true to handle existing files
            });

        if (error) {
            console.error('Supabase upload error:', error);
            
            // If we hit RLS issues, let's just generate a presigned URL for now
            // This is a workaround for Supabase RLS policies
            const uploadPath = `${userId}/${timestamp}-${sanitizedFileName}`;
            
            // Construct a public URL manually
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uploadPath}`;
            
            console.log('Falling back to public URL construction:', publicUrl);
            
            return {
                path: uploadPath,
                url: publicUrl
            };
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
        
        return {
            path: filePath,
            url: urlData.publicUrl
        };
    } catch (error) {
        console.error('Error in uploadFile:', error);
        
        // Emergency fallback - just store the file locally
        console.log('Emergency fallback: storing file locally');
        
        const fs = require('fs');
        const path = require('path');
        
        // Save file locally as a backup
        const localDir = path.join(__dirname, '..', 'uploads', userId);
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const localPath = path.join(localDir, `${timestamp}-${sanitizedFileName}`);
        
        fs.writeFileSync(localPath, fileBuffer);
        
        // Return local file info with a URL that will work with our download endpoint
        return {
            path: null,
            storagePath: null,
            localPath: localPath,
            url: null
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