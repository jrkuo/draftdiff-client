import axios from 'axios';
import pako from 'pako';

/**
 * Fetches and decompresses gzipped JSON data from a public S3 bucket
 * @param {Object} config - Configuration object
 * @param {string} config.bucketUrl - Base URL of the S3 bucket
 * @param {string} config.filename - Name of the gzipped JSON file
 * @returns {Promise<any>} Promise resolving to the parsed JSON data
 */
export async function loadGzippedData(config) {
  try {
    // Add daily cache-busting parameter (same for whole day, updates at midnight)
    // This allows browser caching within the day, but forces refresh daily
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const fullUrl = `${config.bucketUrl}/${config.filename}?v=${today}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    return await response.json(); // browser already decompressed it
  } catch (error) {
    console.error('Error loading gzipped data:', error);
    throw error;
  }
}