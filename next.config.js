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
  // Exclude mobile directory from being processed during build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /mobile\/.*/,
    };
    return config;
  },
  // Ignore TypeScript errors in the mobile directory during build
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 