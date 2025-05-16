import remarkGfm from 'remark-gfm';
import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
let nextConfig = {
  // Allow .md and .mdx extensions for files in the pages directory or app directory
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Add other Next.js configurations here if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 's3.us-west-2.amazonaws.com', // For LunchMoney Avatars
      }
    ],
  },
  experimental: {
    // serverActions: true, // Keep if you were using it
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true, // Keep if you were using it
  },
  webpack: (config, { isServer }) => {
    // Exclude 'fs' module from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false, // Also good to exclude 'path' if not needed client-side
        events: false, // Exclude 'events' module
      };
    }
    // Important: return the modified config
    return config;
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

// Combine MDX and Next.js config
export default withMDX(nextConfig); 