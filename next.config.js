/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Removed /demo redirect - now has its own page
    ]
  },
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
    images: {
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60,
    },

}

module.exports = nextConfig 