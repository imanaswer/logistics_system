// Frontend API Configuration
// This file manages the backend URL for all API calls

// IMPORTANT: Use environment variable for production deployments
// Set NEXT_PUBLIC_API_URL in Vercel dashboard

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://logistics-system-oq8b.onrender.com';

// For local development, you can temporarily change to:
// export const API_URL = 'http://localhost:8001';

// Validate URL format
if (typeof window !== 'undefined') {
  console.log('🔗 Backend API URL:', API_URL);
}
