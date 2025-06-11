const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const bucketName = process.env.SUPABASE_BUCKET;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 * @param {string} userId - The user ID who owns the file
 * @returns {Promise<{path: string, url: string}>} - The path and public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, mimeType, userId) => {
    try {
        // Create a unique path for the file to avoid collisions
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Failed to upload file to Supabase: ${error.message}`);
        }

        // Get the public URL for the file
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file');
        }

        return {
            path: filePath,
            url: urlData.publicUrl
        };
    } catch (error) {
        console.error('Error in uploadFile:', error);
        throw error;
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
        throw error;
    }
};

module.exports = {
    supabase,
    uploadFile,
    deleteFile
}; 