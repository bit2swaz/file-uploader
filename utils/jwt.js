const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;

/**
 * Generate a JWT token for folder sharing
 * @param {string} folderId - ID of the folder to share
 * @param {string} expiry - Expiry period (e.g. '1d', '7d')
 * @returns {string} - JWT token
 */
const generateShareToken = (folderId, expiry) => {
    if (!folderId) {
        throw new Error('Folder ID is required');
    }

    if (!expiry) {
        expiry = '24h'; // Default expiry
    }

    return jwt.sign(
        { folderId: folderId },
        JWT_SECRET,
        { expiresIn: expiry }
    );
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} - Decoded token payload or null if invalid
 */
const verifyShareToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
};

module.exports = {
    generateShareToken,
    verifyShareToken
}; 