/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'tx-app.vercel.app'],
    },
  },
  eslint: {
    // In production builds, don't run ESLint check
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 