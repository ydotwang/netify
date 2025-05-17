/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  /**
   * During `npm run dev` we want the front-end to talk to the already-deployed
   * FastAPI backend on Vercel so no one has to run `uvicorn` locally.
   * In production (the Vercel build) the rewrite list remains empty so the
   * browser will hit the same-origin `/api` serverless function.
   */
  async rewrites() {
    if (isDev) {
      // During local development proxy directly to the deployed backend
      // so no uvicorn is required locally.
      return [
        {
          source: '/backend/main/:path*',
          destination: 'https://netify-five.vercel.app/api/backend/main/:path*',
        },
      ];
    }

    // Production: map the friendly /backend/main/* path to the serverless
    // function path /api/backend/main/*.
    return [
      {
        source: '/backend/main/:path*',
        destination: '/api/backend/main/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 