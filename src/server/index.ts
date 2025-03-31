import { serve } from '@hono/node-server';
import 'dotenv/config';
import api from './api';

const port = process.env.API_PORT || 8000;

// Create a fetch handler for serverless environments
const handler = api;

// Start server for local development if not in Vercel
if (!process.env.VERCEL) {
  console.log(`Server is running on port ${port}`);
  
  serve({
    fetch: api.fetch,
    port: Number(port),
  });
}

// Export the API for serverless environments
export default handler; 