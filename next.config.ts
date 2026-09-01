import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure trailing slashes are not used
  trailingSlash: false,
  // Use static export to ensure all routes work on Vercel
  output: 'export',
};

export default nextConfig;
