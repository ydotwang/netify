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
      // Proxy all api calls to the deployed backend when developing locally
      return [
        {
          source: '/api/app/api/:path*',
          destination: 'https://netify-five.vercel.app/api/app/api/:path*',
        },
      ];
    }

    // No rewrites needed in production – same-origin /api/* already maps to
    // the Python Serverless Function.
    return [];
  },
};

module.exports = nextConfig; 