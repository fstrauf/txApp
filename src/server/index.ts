const { serve } = require('@hono/node-server');
require('dotenv/config');
const api = require('./api');

const port = process.env.API_PORT || 8000;

console.log(`Server is running on port ${port}`);

serve({
  fetch: api.fetch,
  port: Number(port),
}); 