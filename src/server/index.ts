const { serve } = require('@hono/node-server');
require('dotenv/config');
const api = require('./api');

const port = process.env.API_PORT || 8000;

// Check if running in Vercel serverless environment or locally
if (process.env.VERCEL) {
  // Export the fetch handler for serverless environments
  module.exports = api;
} else {
  // Start server for local development
  console.log(`Server is running on port ${port}`);
  
  serve({
    fetch: api.fetch,
    port: Number(port),
  });
} 