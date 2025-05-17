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
      // During local development proxy to the deployed backend
      return [
        {
          source: '/api/:path*',
          destination: 'https://netify-five.vercel.app/api/backend/main/api/:path*',
        },
      ];
    }

    // In production (built by Vercel) rewrite to the nested serverless
    // function path because we removed the api/index.py bridge file.
    return [
      {
        source: '/api/:path*',
        destination: '/api/backend/main/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 