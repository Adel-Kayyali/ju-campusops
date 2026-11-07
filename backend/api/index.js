/**
 * Vercel serverless entry point.
 * Vercel runs `npm run vercel-build` (prisma generate + migrate deploy + nest build),
 * then routes every request to this function (see vercel.json). The Nest application
 * is created once per warm function instance and reused between requests.
 */
const { createApp } = require('../dist/bootstrap');

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const app = await createApp();
    handler = app.getHttpAdapter().getInstance();
  }
  return handler(req, res);
};
