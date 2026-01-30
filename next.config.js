/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // API routes will be handled by Next.js API routes
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
