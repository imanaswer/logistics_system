// Frontend API Configuration
// This file manages the backend URL for all API calls

// IMPORTANT: Use environment variable for production deployments
// Set NEXT_PUBLIC_API_URL in environment variables

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Validate URL format
if (typeof window !== 'undefined') {
  console.log('🔗 Backend API URL:', API_URL);
}
